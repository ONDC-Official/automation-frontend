import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FlowMap } from "@/types/flow-state-type";
import {
    useGetTrackContextQuery,
    useLazyGetMappedFlowQuery,
    useLazyGetRouteQuery,
} from "@store/api";
import MapPanel from "@components/DomainFlowRunner/MapPanel";
import {
    deriveRideMapData,
    deriveRideDisplay,
    isRideMapEnabled,
    isRideEnded,
    phaseToLabel,
    parseGps,
    haversineMeters,
    type LatLng,
    type RideMapData,
} from "@components/DomainFlowRunner/RideMapUtils";
import {
    RideTimeline,
    RideInfoCard,
    RideInfoPanel,
    CompletionSummary,
    RideStatusPanel,
} from "@components/DomainFlowRunner/RideMapOverlays";
import { TRACK_POLL_MS, TRACK_TOKEN_RE } from "./constants";
import { TrackShell, TrackMessage } from "./ui/TrackShell";

/**
 * Public live map for one ride.
 *
 * Reached only by the link the provider puts in `message.tracking.url` on
 * on_track — which is why there is no nav entry and no session in context: the
 * token in the path is all this page has, and it resolves to the session and
 * transaction ids server-side.
 *
 * **Read-only by construction.** The seller drives the ride from the workbench
 * runner; this page never proceeds a step, never fires `trigger_extra`, and
 * hands `MapPanel` no state controls. A viewer pressing anything here would be
 * acting as a provider they are not.
 *
 * The token is derived, not granted — it authorises nothing, so anyone with the
 * link can watch the ride. That is the intended behaviour of a share link, and
 * the same exposure the seller-hosted xInput form URLs already have.
 */
export default function TrackPage() {
    const { token = "" } = useParams<{ token: string }>();
    const tokenLooksValid = TRACK_TOKEN_RE.test(token);

    // Resolve the link once — the ids behind a token never change.
    const {
        data: context,
        isLoading: resolving,
        isError: resolveFailed,
    } = useGetTrackContextQuery({ token }, { skip: !tokenLooksValid });

    const [mappedFlow, setMappedFlow] = useState<FlowMap>({ sequence: [], missedSteps: [] });
    const [rideMap, setRideMap] = useState<RideMapData>({
        isTracking: false,
        hasLocations: false,
    });
    const [tripRoute, setTripRoute] = useState<LatLng[] | null>(null);
    const [activeRoute, setActiveRoute] = useState<{
        geometry: LatLng[];
        distance?: number;
        duration?: number;
    } | null>(null);
    const [phaseTimes, setPhaseTimes] = useState<Record<string, string>>({});
    const [lastUpdate, setLastUpdate] = useState<number | undefined>(undefined);
    const [everLoaded, setEverLoaded] = useState(false);
    const payloadCacheRef = useRef<Map<string, unknown>>(new Map());

    const [triggerGetMappedFlow] = useLazyGetMappedFlowQuery();
    const [triggerGetRoute] = useLazyGetRouteQuery();

    const phase = rideMap.phase;
    const finished = phase === "RIDE_COMPLETED";

    // Poll the ride's mapped status. Stops once the ride completes — the link
    // keeps working and keeps showing the summary, it just has nothing left to
    // ask for.
    useEffect(() => {
        if (!context) return;
        let cancelled = false;
        const fetchOnce = async () => {
            try {
                const data = await triggerGetMappedFlow({
                    transactionId: context.transaction_id,
                    sessionId: context.session_id,
                }).unwrap();
                if (!cancelled) {
                    setMappedFlow(data);
                    setEverLoaded(true);
                }
            } catch (e) {
                // Transient: the ride may still be live, so keep polling.
                console.error("TrackPage: failed to fetch mapped flow", e);
            }
        };
        fetchOnce();
        if (finished) return;
        const id = setInterval(fetchOnce, TRACK_POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [context, finished]);

    // Derive pickup/drop/driver/phase from the latest payloads on each poll.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await deriveRideMapData(mappedFlow, payloadCacheRef.current);
            if (!cancelled) setRideMap(data);
        })();
        return () => {
            cancelled = true;
        };
    }, [mappedFlow]);

    // Road-following pickup → destination path, refetched when the stops change.
    useEffect(() => {
        const { pickupGps, dropGps } = rideMap;
        if (!pickupGps || !dropGps) {
            setTripRoute(null);
            return;
        }
        let cancelled = false;
        (async () => {
            const res = (await triggerGetRoute({ from: pickupGps, to: dropGps })).data;
            if (cancelled) return;
            if (res?.geometry?.length) {
                setTripRoute(res.geometry);
                setActiveRoute({
                    geometry: res.geometry,
                    distance: res.distance,
                    duration: res.duration,
                });
                return;
            }
            // OSRM unavailable — fall back to a straight line so the map still
            // shows the trip rather than nothing.
            const from = parseGps(pickupGps);
            const to = parseGps(dropGps);
            if (!from || !to) return;
            const dist = haversineMeters(from, to);
            setTripRoute([from, to]);
            setActiveRoute({ geometry: [from, to], distance: dist, duration: dist / 11.1 });
        })();
        return () => {
            cancelled = true;
        };
    }, [rideMap.pickupGps, rideMap.dropGps]);

    // Record when each ride state was first seen, for the timeline.
    useEffect(() => {
        if (!phase) return;
        setPhaseTimes((prev) =>
            prev[phase] ? prev : { ...prev, [phase]: new Date().toISOString() }
        );
    }, [phase]);

    // Freshness indicator — ticks so "updated Ns ago" keeps counting.
    useEffect(() => {
        if (rideMap.driverGps) setLastUpdate(Date.now());
    }, [rideMap.driverGps]);
    const [, forceTick] = useState(0);
    useEffect(() => {
        if (finished) return;
        const id = setInterval(() => forceTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [finished]);
    const agoSec =
        lastUpdate != null ? Math.max(0, Math.round((Date.now() - lastUpdate) / 1000)) : undefined;

    if (!tokenLooksValid) {
        return (
            <TrackShell>
                <TrackMessage
                    title="This tracking link isn't valid"
                    detail="Check that you copied the whole link — it's easy to miss the end."
                />
            </TrackShell>
        );
    }

    if (resolving) {
        return (
            <TrackShell>
                <TrackMessage title="Finding your ride…" />
            </TrackShell>
        );
    }

    if (resolveFailed || !context) {
        return (
            <TrackShell>
                <TrackMessage
                    title="This tracking link has expired"
                    detail="The ride it points to is no longer available."
                />
            </TrackShell>
        );
    }

    // The map only knows how to read TRV10 rides; any other domain would render
    // an empty map rather than say so.
    if (!isRideMapEnabled(context.domain, context.version)) {
        return (
            <TrackShell>
                <TrackMessage
                    title="Nothing to track here"
                    detail="This link points to a transaction that isn't a ride."
                />
            </TrackShell>
        );
    }

    if (!everLoaded) {
        return (
            <TrackShell>
                <TrackMessage title="Loading your ride…" />
            </TrackShell>
        );
    }

    const display = deriveRideDisplay({
        phase,
        orderStatus: rideMap.orderStatus,
        error: rideMap.error,
    });

    // Terminal / failure outcomes get the status panel, no map.
    if (display.kind === "DRIVER_NOT_FOUND" || display.kind === "AWAITING_DRIVER") {
        return (
            <TrackShell>
                <RideStatusPanel
                    kind={display.kind}
                    title={display.title}
                    detail={display.detail}
                />
            </TrackShell>
        );
    }

    if (!rideMap.isTracking) {
        return (
            <TrackShell>
                <TrackMessage
                    title="Your ride hasn't started yet"
                    detail="This page will update on its own once a driver is assigned."
                />
            </TrackShell>
        );
    }

    return (
        <TrackShell>
            <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span
                        className={`inline-block h-2 w-2 rounded-full ${
                            finished
                                ? "bg-gray-300"
                                : agoSec != null && agoSec <= 10
                                  ? "bg-emerald-500"
                                  : "bg-amber-400"
                        }`}
                    />
                    {finished
                        ? "Ride complete"
                        : agoSec != null
                          ? `Live · updated ${agoSec}s ago`
                          : "Live"}
                </span>
            </div>

            <RideTimeline currentState={phase} times={phaseTimes} />

            <RideInfoCard driver={rideMap.driver} vehicle={rideMap.vehicle} fare={rideMap.fare} />

            {finished ? (
                <CompletionSummary
                    driver={rideMap.driver}
                    vehicle={rideMap.vehicle}
                    fare={rideMap.fare}
                    distanceM={activeRoute?.distance}
                    durationS={activeRoute?.duration}
                />
            ) : (
                <RideInfoPanel
                    targetLabel="to destination"
                    totalDistanceM={activeRoute?.distance}
                    totalDurationS={activeRoute?.duration}
                    progress={0}
                />
            )}

            <MapPanel
                pickupGps={rideMap.pickupGps}
                dropGps={rideMap.dropGps}
                driverGps={rideMap.driverGps}
                phaseLabel={phaseToLabel(phase)}
                interactive={false}
                locked={isRideEnded(phase)}
                route={tripRoute ?? undefined}
                tripRoute={tripRoute ?? undefined}
                progress={0}
                fitKey={`${rideMap.pickupGps ?? ""}|${rideMap.dropGps ?? ""}`}
            />
        </TrackShell>
    );
}
