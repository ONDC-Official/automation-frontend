import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FlowMap } from "@/types/flow-state-type";
import { useSession } from "@context/context";
import { triggerExtra, getMappedFlow, getRoute } from "@utils/request-utils";
import MapPanel from "@components/FlowShared/map-panel";
import {
    deriveRideMapData,
    currentRideState,
    isRideEnded,
    nextAutoState,
    phaseToLabel,
    pointAlong,
    parseGps,
    type LatLng,
} from "@components/FlowShared/ride-map-utils";

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
    }>({ isTracking: false });
    const [localDriverGps, setLocalDriverGps] = useState<string | undefined>(undefined);
    const [localPhase, setLocalPhase] = useState<string | undefined>(undefined);
    const [trackingReset, setTrackingReset] = useState(false);
    const autoStateFiredRef = useRef<Set<string>>(new Set());
    const payloadCacheRef = useRef<Map<string, unknown>>(new Map());

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
    const SEGMENT_MS = 20000; // ~20s to traverse a segment
    const VISUAL_MS = 200; // smooth marker update
    const NET_MS = 2000; // on_track sent to the buyer every 2s

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

    // Road-following path between two "lat, lng" points (fallback: straight line).
    const buildPath = async (fromGps?: string, toGps?: string): Promise<LatLng[]> => {
        const from = parseGps(fromGps);
        const to = parseGps(toGps);
        if (!from || !to) return [];
        const res = await getRoute(fromGps as string, toGps as string);
        return res?.geometry?.length ? res.geometry : [from, to];
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
    };

    // Enroute → animate to pickup → auto Arrived. Started → animate to drop → auto End+Completed.
    const handleRideState = async (code: string) => {
        if (code === "RIDE_ENROUTE_PICKUP") {
            await sendRideState(code);
            const driverNow = localDriverGps ?? rideMap.driverGps ?? rideMap.pickupGps;
            const path = await buildPath(driverNow, rideMap.pickupGps);
            animateDriver(path, () => sendRideState("RIDE_ARRIVED_PICKUP"));
            return;
        }
        if (code === "RIDE_STARTED") {
            await sendRideState(code);
            const path = await buildPath(rideMap.pickupGps, rideMap.dropGps);
            animateDriver(path, () => endRide());
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
        stopAnimation();
        setTrackingReset(true);
        setLocalDriverGps(undefined);
        setLocalPhase(undefined);
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

    if (!flowId || !transactionId) {
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                Start a ride-hailing flow to view its map here.
            </div>
        );
    }

    if (!rideMap.isTracking || trackingReset) {
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                The ride map appears once the ride is confirmed (driver assigned).
            </div>
        );
    }

    return (
        <div className="p-2">
            <MapPanel
                pickupGps={rideMap.pickupGps}
                dropGps={rideMap.dropGps}
                driverGps={driverGpsForMap}
                phaseLabel={phaseToLabel(phase)}
                interactive={isController}
                locked={rideEnded}
                onDriverMove={sendDriverMove}
                onReset={handleResetTracking}
                currentState={phase}
                onRideState={handleRideState}
            />
        </div>
    );
}
