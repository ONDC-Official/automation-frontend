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
    progressAlong,
    haversineMeters,
    type LatLng,
    type RideMapData,
} from "@components/DomainFlowRunner/RideMapUtils";
import { useSmoothedDriver } from "./useSmoothedDriver";
import {
    RideTimeline,
    RideInfoCard,
    RideInfoPanel,
    CompletionSummary,
    RideStatusPanel,
} from "@components/DomainFlowRunner/RideMapOverlays";
import { TRACK_POLL_MS, TRACK_TOKEN_RE } from "./constants";
import { TrackShell, TrackMessage } from "./ui/TrackShell";

/** A leg of the journey the driver is travelling, with metrics for the ETA panel. */
type Segment = {
    geometry: LatLng[];
    distance?: number;
    duration?: number;
    target: "pickup" | "destination";
};

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
 * Unlike the runner, this page only ever *observes* movement, so the marker is
 * interpolated between fixes (see `useSmoothedDriver`) rather than driven by a
 * local animation.
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
    // Mirrors the workbench's own segment shape so the same overlays can read it.
    const [tripRoute, setTripRoute] = useState<Segment | null>(null);
    const [activeRoute, setActiveRoute] = useState<Segment | null>(null);
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

    // Road-following segment between two "lat, lng" points, with distance/duration
    // for the ETA panel. Falls back to a straight line so the map still shows the
    // trip when OSRM is unavailable.
    const buildSegment = async (
        fromGps: string,
        toGps: string,
        target: "pickup" | "destination"
    ): Promise<Segment | null> => {
        const res = (await triggerGetRoute({ from: fromGps, to: toGps })).data;
        if (res?.geometry?.length) {
            return {
                geometry: res.geometry,
                distance: res.distance,
                duration: res.duration,
                target,
            };
        }
        const from = parseGps(fromGps);
        const to = parseGps(toGps);
        if (!from || !to) return null;
        const dist = haversineMeters(from, to);
        return { geometry: [from, to], distance: dist, duration: dist / 11.1, target };
    };

    // The full pickup → destination trip, drawn as a persistent base beneath the
    // active segment. Refetched only when the stops themselves change.
    useEffect(() => {
        const { pickupGps, dropGps } = rideMap;
        if (!pickupGps || !dropGps) {
            setTripRoute(null);
            return;
        }
        let cancelled = false;
        buildSegment(pickupGps, dropGps, "destination").then((seg) => {
            if (!cancelled && seg) setTripRoute(seg);
        });
        return () => {
            cancelled = true;
        };
    }, [rideMap.pickupGps, rideMap.dropGps]);

    // The segment the driver is currently travelling, mirroring the workbench:
    // driver → pickup while enroute, pickup → destination once the ride starts.
    // Built once per phase from the first fix seen in it — rebuilding on every
    // driver update would mean an OSRM call per poll, and the marker interpolates
    // along this geometry anyway.
    const enrouteBuiltRef = useRef(false);
    useEffect(() => {
        if (phase !== "RIDE_ENROUTE_PICKUP") {
            enrouteBuiltRef.current = false;
            return;
        }
        const { driverGps, pickupGps } = rideMap;
        if (enrouteBuiltRef.current || !driverGps || !pickupGps) return;
        enrouteBuiltRef.current = true;
        let cancelled = false;
        buildSegment(driverGps, pickupGps, "pickup").then((seg) => {
            if (!cancelled && seg) setActiveRoute(seg);
        });
        return () => {
            cancelled = true;
        };
    }, [phase, rideMap.driverGps, rideMap.pickupGps]);

    // Every other phase travels the trip route.
    useEffect(() => {
        if (phase === "RIDE_ENROUTE_PICKUP" || !tripRoute) return;
        setActiveRoute(tripRoute);
    }, [phase, tripRoute]);

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

    // Glide between observed fixes along the active segment, so the marker follows
    // the road instead of teleporting once per poll. Freshness above still counts
    // from the real fix, not from the animation.
    const smoothedDriverGps = useSmoothedDriver(
        rideMap.driverGps,
        activeRoute?.geometry,
        TRACK_POLL_MS
    );

    // Fraction of the active segment covered — drives the two-tone polyline and the
    // ETA bar. Read from the smoothed position so both advance with the marker.
    const progress = activeRoute
        ? progressAlong(activeRoute.geometry, parseGps(smoothedDriverGps))
        : 0;

    // ETA is meaningful only while the driver is actually travelling a leg.
    const showEta = !!activeRoute && (phase === "RIDE_ENROUTE_PICKUP" || phase === "RIDE_STARTED");

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
            ) : showEta ? (
                <RideInfoPanel
                    targetLabel={activeRoute?.target === "pickup" ? "to pickup" : "to destination"}
                    totalDistanceM={activeRoute?.distance}
                    totalDurationS={activeRoute?.duration}
                    progress={progress}
                />
            ) : null}

            <MapPanel
                pickupGps={rideMap.pickupGps}
                dropGps={rideMap.dropGps}
                driverGps={smoothedDriverGps}
                phaseLabel={phaseToLabel(phase)}
                interactive={false}
                locked={isRideEnded(phase)}
                route={activeRoute?.geometry ?? tripRoute?.geometry}
                tripRoute={tripRoute?.geometry}
                progress={progress}
                fitKey={`${rideMap.pickupGps ?? ""}|${rideMap.dropGps ?? ""}`}
            />
        </TrackShell>
    );
}
