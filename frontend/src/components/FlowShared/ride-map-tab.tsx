import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FlowMap } from "@/types/flow-state-type";
import { useSession } from "@context/context";
import { triggerExtra, getMappedFlow, getRoute } from "@utils/request-utils";
import MapPanel from "@components/FlowShared/map-panel";
import {
    deriveRideMapData,
    deriveRideDisplay,
    currentRideState,
    isRideEnded,
    nextAutoState,
    phaseToLabel,
    pointAlong,
    progressAlong,
    parseGps,
    haversineMeters,
    type LatLng,
} from "@components/FlowShared/ride-map-utils";
import {
    RideTimeline,
    RideInfoPanel,
    RideInfoCard,
    CompletionSummary,
    RideStatusPanel,
} from "@components/FlowShared/ride-map-overlays";

const POLL_MS = 4000;

/**
 * Ride map rendered inside the right-panel "Application" tab. Self-contained: it polls the active
 * flow's mapped status and owns all controller logic (driver drag, ride-state changes, geofence).
 * Control lives on the seller side (BAP); the buyer (BPP) gets the read-only map.
 */
export default function RideMapTab({ flowId }: { flowId: string | null }) {
    const { sessionId, sessionData } = useSession();
    const isController = sessionData?.npType === "BAP";
    const transactionId = flowId ? (sessionData?.flowMap?.[flowId] ?? undefined) : undefined;

    const [mappedFlow, setMappedFlow] = useState<FlowMap>({ sequence: [], missedSteps: [] });
    const [rideMap, setRideMap] = useState<{
        pickupGps?: string;
        dropGps?: string;
        driverGps?: string;
        phase?: string;
        isTracking: boolean;
        hasLocations?: boolean;
        orderStatus?: string;
        error?: { code?: string; message?: string };
    }>({ isTracking: false, hasLocations: false });
    const [localDriverGps, setLocalDriverGps] = useState<string | undefined>(undefined);
    const [localPhase, setLocalPhase] = useState<string | undefined>(undefined);
    const [trackingReset, setTrackingReset] = useState(false);
    const autoStateFiredRef = useRef<Set<string>>(new Set());
    const payloadCacheRef = useRef<Map<string, unknown>>(new Map());

    // Active segment route (drives the map polyline, the two-tone progress and the ETA panel).
    type Segment = { geometry: LatLng[]; distance?: number; duration?: number; target: "pickup" | "destination" };
    const [activeRoute, setActiveRoute] = useState<Segment | null>(null);
    // Persistent full pickup→destination trip path — drawn as a blue base so it stays visible even
    // while the active segment is driver→pickup (enroute).
    const [tripRoute, setTripRoute] = useState<Segment | null>(null);
    // Time each ride state was first observed — powers the status timeline (both sides).
    const [phaseTimes, setPhaseTimes] = useState<Record<string, string>>({});

    // ⑦ Auto-run + speed; ⑧ live freshness.
    const [speed, setSpeed] = useState(1); // animation speed multiplier (1×/2×/4×)
    const autoRunRef = useRef(false);
    const [autoRunActive, setAutoRunActive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number | undefined>(undefined);
    const [, forceTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => forceTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    // Poll the active flow's mapped status.
    useEffect(() => {
        if (!transactionId || !sessionId) return;
        let cancelled = false;
        const fetchOnce = async () => {
            try {
                const data = await getMappedFlow(transactionId, sessionId);
                if (!cancelled) setMappedFlow(data);
            } catch (e) {
                console.error("RideMapTab: failed to fetch mapped flow", e);
            }
        };
        fetchOnce();
        const id = setInterval(fetchOnce, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [transactionId, sessionId]);

    // Derive pickup/drop/driver/phase from the latest payloads on each poll.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await deriveRideMapData(
                mappedFlow,
                payloadCacheRef.current as Map<string, any>
            );
            if (!cancelled) setRideMap(data);
        })();
        return () => {
            cancelled = true;
        };
    }, [mappedFlow]);

    // `code` is the RIDE_* fulfillment-state code (the button values are the codes themselves).
    const sendRideState = async (code: string) => {
        if (!transactionId || !sessionData) return;
        const prevPhase = localPhase;
        setLocalPhase(code);
        // RIDE_ENDED is delivered via on_update (per the contract); all other states via on_status.
        const extraKey = code === "RIDE_ENDED" ? "on_update_state" : "on_status_state";
        try {
            const res = await triggerExtra(sessionId, transactionId, extraKey, { code });
            if (res?.success === false) {
                setLocalPhase(prevPhase);
                toast.error(res.message || "Ride state not dispatched");
                console.warn("on_status_state trigger rejected:", res.message);
            }
        } catch (e) {
            setLocalPhase(prevPhase);
            toast.error("Failed to send ride state");
            console.error(e);
        }
    };

    // --- Driver auto-movement animation ------------------------------------
    const animRef = useRef<{ visual: number | null; net: number | null; cancelled: boolean } | null>(
        null
    );
    const BASE_SEGMENT_MS = 20000; // ~20s to traverse a segment at 1×
    const VISUAL_MS = 200; // smooth marker update
    const NET_MS = 2000; // on_track sent to the buyer every 2s
    const SEGMENT_MS = BASE_SEGMENT_MS / speed; // speed-aware (⑦)

    const stopAnimation = () => {
        const a = animRef.current;
        if (a) {
            a.cancelled = true;
            if (a.visual) clearInterval(a.visual);
            if (a.net) clearInterval(a.net);
        }
        animRef.current = null;
    };

    // on_track network send only (no geofence) — used by the animation loop.
    const sendOnTrack = async (gps: string) => {
        if (!transactionId || !sessionData) return;
        try {
            await triggerExtra(sessionId, transactionId, "on_track_driver_move", { gps });
        } catch (e) {
            console.error("on_track (animation) failed", e);
        }
    };

    // Road-following segment between two "lat, lng" points, with distance/duration for the ETA
    // panel (fallback: straight line + ~40 km/h estimate).
    const buildSegment = async (
        fromGps: string | undefined,
        toGps: string | undefined,
        target: "pickup" | "destination"
    ): Promise<Segment | null> => {
        const from = parseGps(fromGps);
        const to = parseGps(toGps);
        if (!from || !to) return null;
        const res = await getRoute(fromGps as string, toGps as string);
        if (res?.geometry?.length) {
            return { geometry: res.geometry, distance: res.distance, duration: res.duration, target };
        }
        const dist = haversineMeters(from, to);
        return { geometry: [from, to], distance: dist, duration: dist / 11.1 /* ~40km/h */, target };
    };

    // Animate the driver along `path` over SEGMENT_MS: smooth local marker (VISUAL_MS),
    // on_track to the buyer every NET_MS, and onArrive() once the end is reached.
    const animateDriver = (path: LatLng[], onArrive: () => void) => {
        stopAnimation();
        if (!path || path.length < 2) {
            onArrive();
            return;
        }
        const startTs = Date.now();
        const state = { visual: null as number | null, net: null as number | null, cancelled: false };
        animRef.current = state;
        const posAt = (f: number): string | undefined => {
            const p = pointAlong(path, f);
            return p ? `${p[0]}, ${p[1]}` : undefined;
        };
        state.visual = window.setInterval(() => {
            if (state.cancelled) return;
            const f = Math.min(1, (Date.now() - startTs) / SEGMENT_MS);
            const gps = posAt(f);
            if (gps) setLocalDriverGps(gps);
            if (f >= 1) {
                stopAnimation();
                const endGps = posAt(1);
                if (endGps) sendOnTrack(endGps);
                onArrive();
            }
        }, VISUAL_MS);
        state.net = window.setInterval(() => {
            if (state.cancelled) return;
            const gps = posAt(Math.min(1, (Date.now() - startTs) / SEGMENT_MS));
            if (gps) sendOnTrack(gps);
        }, NET_MS);
        const first = posAt(0);
        if (first) sendOnTrack(first); // initial location immediately
    };

    // End the ride: on_update (RIDE_ENDED) then ONE unsolicited on_status marking the order
    // completed (order.status = COMPLETE, state = RIDE_COMPLETED). Fires the completed step once.
    const completedFiredRef = useRef(false);
    const endRide = async () => {
        await sendRideState("RIDE_ENDED"); // on_update
        if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            await sendRideState("RIDE_COMPLETED"); // on_status → order.status COMPLETE
        }
        autoRunRef.current = false;
        setAutoRunActive(false);
    };

    // Enroute → animate to pickup → auto Arrived. Started → animate to drop → auto End+Completed.
    const handleRideState = async (code: string) => {
        if (code === "RIDE_ENROUTE_PICKUP") {
            await sendRideState(code);
            const driverNow = localDriverGps ?? rideMap.driverGps ?? rideMap.pickupGps;
            const seg = await buildSegment(driverNow, rideMap.pickupGps, "pickup");
            if (seg) setActiveRoute(seg);
            animateDriver(seg?.geometry ?? [], () => {
                sendRideState("RIDE_ARRIVED_PICKUP");
                // ⑦ Auto-run: after arriving, continue to Started on its own.
                if (autoRunRef.current) setTimeout(() => handleRideState("RIDE_STARTED"), 1200);
            });
            return;
        }
        if (code === "RIDE_STARTED") {
            await sendRideState(code);
            const seg = await buildSegment(rideMap.pickupGps, rideMap.dropGps, "destination");
            if (seg) setActiveRoute(seg);
            animateDriver(seg?.geometry ?? [], () => endRide());
            return;
        }
        if (code === "RIDE_ENDED") {
            stopAnimation();
            endRide();
            return;
        }
        // Arrived / Completed / Cancel — stop any movement and send the state.
        stopAnimation();
        sendRideState(code);
    };

    // ⑦ Auto-run the whole ride hands-free: Enroute → (auto) Arrived → Started → Ended → Completed.
    const startAutoRun = () => {
        autoRunRef.current = true;
        setAutoRunActive(true);
        handleRideState("RIDE_ENROUTE_PICKUP");
    };
    const stopAutoRun = () => {
        autoRunRef.current = false;
        setAutoRunActive(false);
        stopAnimation();
    };

    // Stop the animation on unmount.
    useEffect(() => () => stopAnimation(), []);

    const sendDriverMove = async (gps: string) => {
        if (!transactionId || !sessionData) return;
        setLocalDriverGps(gps);

        const auto = nextAutoState(gps, rideMap.pickupGps, rideMap.dropGps);
        if (auto && !autoStateFiredRef.current.has(auto)) {
            autoStateFiredRef.current.add(auto);
            sendRideState(auto);
        }

        try {
            const res = await triggerExtra(sessionId, transactionId, "on_track_driver_move", {
                gps,
            });
            if (res?.success === false) {
                toast.error(res.message || "Driver location not dispatched");
                console.warn("on_track_driver_move trigger rejected:", res.message);
            }
        } catch (e) {
            toast.error("Failed to update driver location");
            console.error(e);
        }
    };

    const handleResetTracking = () => {
        stopAutoRun();
        setTrackingReset(true);
        setLocalDriverGps(undefined);
        setLocalPhase(undefined);
        setActiveRoute(null);
        setTripRoute(null);
        setPhaseTimes({});
        completedFiredRef.current = false;
        autoStateFiredRef.current.clear();
        payloadCacheRef.current.clear();
        toast.info("Tracking reset");
    };

    const phase = localPhase ?? rideMap.phase ?? currentRideState(mappedFlow);
    const rideEnded = isRideEnded(phase);
    const driverGpsForMap = isController
        ? (localDriverGps ?? rideMap.driverGps)
        : rideMap.driverGps;

    // ⑧ Freshness: mark the last time the driver position changed.
    useEffect(() => {
        if (driverGpsForMap) setLastUpdate(Date.now());
    }, [driverGpsForMap]);
    const agoSec = lastUpdate != null ? Math.max(0, Math.round((Date.now() - lastUpdate) / 1000)) : undefined;

    // Record the time each ride state is first seen (powers the timeline on both sides).
    useEffect(() => {
        if (!phase) return;
        setPhaseTimes((prev) => (prev[phase] ? prev : { ...prev, [phase]: new Date().toISOString() }));
    }, [phase]);

    // Trip route: fetch pickup→drop as soon as both locations are known so the full trip path is
    // always shown (preview and throughout the ride). The active segment (enroute = driver→pickup)
    // is layered on top of this persistent base.
    useEffect(() => {
        if (tripRoute || !rideMap.pickupGps || !rideMap.dropGps) return;
        let cancelled = false;
        buildSegment(rideMap.pickupGps, rideMap.dropGps, "destination").then((seg) => {
            if (!cancelled && seg) setTripRoute(seg);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rideMap.pickupGps, rideMap.dropGps]);

    // Driver progress along the active segment (drives two-tone route + ETA panel).
    const progress = activeRoute
        ? progressAlong(activeRoute.geometry, parseGps(driverGpsForMap))
        : 0;

    if (!flowId || !transactionId) {
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                Start a ride-hailing flow to view its map here.
            </div>
        );
    }

    // State-based outcome (driven purely by order.status + ride state + error). Non-active terminal
    // / failure outcomes get a read-only status panel — no map, no ride controls. The seller's live
    // local phase takes precedence so map-driven cancels reflect immediately.
    const display = deriveRideDisplay({
        phase,
        orderStatus: rideMap.orderStatus,
        error: rideMap.error,
    });
    if (
        rideMap.isTracking &&
        !trackingReset &&
        (display.kind === "DRIVER_NOT_FOUND" ||
            display.kind === "AWAITING_DRIVER" ||
            display.kind === "CANCELLED" ||
            display.kind === "CANCELLING")
    ) {
        return <RideStatusPanel kind={display.kind} title={display.title} detail={display.detail} />;
    }

    if (!rideMap.isTracking || trackingReset) {
        // Preview: as soon as start & end locations are entered (search onward), show the map with
        // pickup/drop pins and the trip route — read-only — on both buyer and seller sides. The live
        // driver simulation + state controls appear once the ride is confirmed.
        if (rideMap.hasLocations && !trackingReset) {
            return (
                <div className="p-2 space-y-2">
                    <div className="rounded-md border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-800">
                        📍 Pickup &amp; destination set · the live ride map starts once the ride is
                        confirmed.
                    </div>
                    <MapPanel
                        pickupGps={rideMap.pickupGps}
                        dropGps={rideMap.dropGps}
                        interactive={false}
                        route={tripRoute?.geometry}
                        progress={0}
                    />
                </div>
            );
        }
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                The ride map appears once you enter the pickup &amp; destination locations.
            </div>
        );
    }

    const showEta =
        !!activeRoute &&
        (phase === "RIDE_ENROUTE_PICKUP" || phase === "RIDE_STARTED");
    const finished = phase === "RIDE_COMPLETED" || phase === "RIDE_CANCELLED";

    return (
        <div className="p-2 space-y-2">
            {/* ⑧ Live freshness + ⑦ auto-run / speed (controller only). */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                        className={`inline-block h-2 w-2 rounded-full ${
                            agoSec != null && agoSec <= 5 ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                    />
                    {agoSec != null ? `Live · updated ${agoSec}s ago` : "Live"}
                </span>
                {isController && !finished && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={autoRunActive ? stopAutoRun : startAutoRun}
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                autoRunActive
                                    ? "border-amber-400 bg-amber-50 text-amber-700"
                                    : "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                            }`}
                        >
                            {autoRunActive ? "■ Stop" : "▶ Auto-run"}
                        </button>
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                            {[1, 2, 4].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSpeed(s)}
                                    className={`rounded px-1.5 py-0.5 ${
                                        speed === s
                                            ? "bg-sky-600 text-white"
                                            : "text-gray-500 hover:bg-gray-100"
                                    }`}
                                >
                                    {s}×
                                </button>
                            ))}
                        </span>
                    </div>
                )}
            </div>

            {/* ① Status timeline */}
            <RideTimeline
                currentState={phase}
                times={phaseTimes}
                cancelled={phase === "RIDE_CANCELLED"}
            />

            {/* ②/⑤ Driver / vehicle / fare card */}
            <RideInfoCard driver={rideMap.driver} vehicle={rideMap.vehicle} fare={rideMap.fare} />

            {/* ⑥ Completion summary (replaces ETA once the ride finishes) */}
            {finished && (
                <CompletionSummary
                    cancelled={phase === "RIDE_CANCELLED"}
                    driver={rideMap.driver}
                    vehicle={rideMap.vehicle}
                    fare={rideMap.fare}
                    distanceM={activeRoute?.distance}
                    durationS={activeRoute?.duration}
                />
            )}

            {/* ③ Live ETA / distance / progress (during movement segments) */}
            {showEta && (
                <RideInfoPanel
                    targetLabel={
                        activeRoute?.target === "pickup" ? "to pickup" : "to destination"
                    }
                    totalDistanceM={activeRoute?.distance}
                    totalDurationS={activeRoute?.duration}
                    progress={progress}
                />
            )}

            <MapPanel
                pickupGps={rideMap.pickupGps}
                dropGps={rideMap.dropGps}
                driverGps={driverGpsForMap}
                phaseLabel={phaseToLabel(phase)}
                interactive={isController}
                locked={rideEnded}
                route={activeRoute?.geometry ?? tripRoute?.geometry}
                tripRoute={tripRoute?.geometry}
                progress={progress}
                onDriverMove={sendDriverMove}
                onReset={handleResetTracking}
                currentState={phase}
                onRideState={handleRideState}
            />
        </div>
    );
}
