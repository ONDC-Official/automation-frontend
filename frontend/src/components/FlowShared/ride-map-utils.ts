import { FlowMap, MappedStep } from "@/types/flow-state-type";
import { getCompletePayload } from "@utils/request-utils";

/**
 * Real-Time Ride Map Integration — payload derivation helpers.
 *
 * The mapped flow only carries payload *ids*; the actual TRV10 message content
 * (stops, tracking GPS, fulfillment state) is fetched on demand and parsed here.
 * All parsing is tolerant (recursive search) since exact nesting varies by flow.
 */

export interface RideMapData {
    pickupGps?: string;
    dropGps?: string;
    driverGps?: string;
    phase?: string;
    isTracking: boolean;
}

const RIDE_PHASE_LABELS: Record<string, string> = {
    RIDE_ASSIGNED: "Driver assigned",
    RIDE_ENROUTE_PICKUP: "Heading to pickup",
    RIDE_ARRIVED_PICKUP: "Driver arrived",
    RIDE_STARTED: "Ride started",
    RIDE_ENDED: "Ride ended",
    RIDE_COMPLETED: "Ride completed (settled)",
    RIDE_CANCELLED: "Cancelled",
};

export const phaseToLabel = (phase?: string): string | undefined =>
    phase ? (RIDE_PHASE_LABELS[phase] ?? phase) : undefined;

export const isRideEnded = (phase?: string): boolean =>
    phase === "RIDE_ENDED" || phase === "RIDE_COMPLETED" || phase === "RIDE_CANCELLED";

// Ordered forward ride states the seller can advance through (RIDE_ASSIGNED is set by on_confirm).
export const RIDE_STATE_ORDER = [
    "RIDE_ENROUTE_PICKUP",
    "RIDE_ARRIVED_PICKUP",
    "RIDE_STARTED",
    "RIDE_ENDED",
    "RIDE_COMPLETED",
] as const;
export type RideState = (typeof RIDE_STATE_ORDER)[number];

// Terminal cancel branch — rendered as a separate control, not part of the forward progression.
export const RIDE_CANCEL_STATE = "RIDE_CANCELLED";

// Short labels for the state buttons.
export const RIDE_STATE_BUTTON_LABEL: Record<string, string> = {
    RIDE_ENROUTE_PICKUP: "Enroute",
    RIDE_ARRIVED_PICKUP: "Arrived",
    RIDE_STARTED: "Started",
    RIDE_ENDED: "Ended",
    RIDE_COMPLETED: "Completed",
    RIDE_CANCELLED: "Cancel",
};

// --- geometry helpers -------------------------------------------------------

export type LatLng = [number, number];

export const parseGps = (s?: string): LatLng | null => {
    if (!s) return null;
    const [lat, lng] = s.split(",").map((p) => Number(p.trim()));
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

/** Compass bearing in degrees (0 = North, clockwise) from `a` to `b` — drives the driver arrow. */
export function bearing(a: LatLng, b: LatLng): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance in metres (haversine) — drives geofence auto-transitions. */
export function haversineMeters(a: LatLng, b: LatLng): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
        Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Position at `fraction` (0..1) of the total length along a polyline path — drives animation. */
export function pointAlong(path: LatLng[], fraction: number): LatLng | null {
    if (!path || path.length === 0) return null;
    if (path.length === 1) return path[0];
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
    const total = cum[cum.length - 1];
    if (total === 0) return path[0];
    const target = Math.max(0, Math.min(1, fraction)) * total;
    let i = 1;
    while (i < cum.length && cum[i] < target) i++;
    if (i >= cum.length) return path[path.length - 1];
    const t = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    const a = path[i - 1];
    const b = path[i];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Map an on_status step's key (or on_confirm) to the ride state it represents. */
export function stepToRideState(actionType: string, actionId: string): RideState | "RIDE_ASSIGNED" | undefined {
    if (actionType === "on_confirm") return "RIDE_ASSIGNED";
    if (actionType !== "on_status") return undefined;
    const key = (actionId || "").toLowerCase();
    // NOTE: check "unsolicited" BEFORE "solicited" — otherwise "unsolicited".includes("solicited")
    // wrongly maps the enroute status to RIDE_ENDED (which locks the whole map).
    if (key.includes("unsolicited")) return "RIDE_ENROUTE_PICKUP";
    if (key.includes("arrived")) return "RIDE_ARRIVED_PICKUP";
    if (key.includes("started")) return "RIDE_STARTED";
    if (key.includes("solicited") || key.includes("ended") || key.includes("paid"))
        return "RIDE_ENDED";
    return "RIDE_ENROUTE_PICKUP";
}

/** The ride state of the next not-yet-complete `on_status` step (what the seller can advance to). */
export function nextPendingRideState(mappedFlow: FlowMap): RideState | undefined {
    const step = (mappedFlow.sequence ?? []).find(
        (s) => s.actionType === "on_status" && s.status !== "COMPLETE"
    );
    if (!step) return undefined;
    return stepToRideState(step.actionType, step.actionId) as RideState | undefined;
}

/**
 * The current ride state — derived DETERMINISTICALLY from the latest COMPLETE on_status/on_confirm
 * step, so the map always mirrors what the flow has actually sent (no payload guessing).
 */
export function currentRideState(mappedFlow: FlowMap): string | undefined {
    let state: string | undefined;
    for (const s of mappedFlow.sequence ?? []) {
        if (s.status !== "COMPLETE") continue;
        const mapped = stepToRideState(s.actionType, s.actionId);
        if (mapped) state = mapped;
    }
    return state;
}

/** Step types that belong to the tracking phase (after on_confirm) and must NOT auto-proceed. */
const TRACKING_PHASE_TYPES = new Set(["track", "on_track", "on_status", "on_update", "status"]);
export const isTrackingPhaseStep = (actionType?: string): boolean =>
    !!actionType && TRACKING_PHASE_TYPES.has(actionType);

/**
 * Synchronous "is the ride confirmed?" check — the ride map / tracking phase is active once a
 * confirm OR on_confirm is COMPLETE (from either side's recorded view).
 */
export function isTrackingActive(mappedFlow: FlowMap): boolean {
    const lists = [
        mappedFlow.sequence ?? [],
        mappedFlow.extraSteps ?? [],
        mappedFlow.missedSteps ?? [],
    ];
    return lists.some((l) =>
        l.some(
            (s) =>
                (s.actionType === "on_confirm" || s.actionType === "confirm") &&
                s.status === "COMPLETE"
        )
    );
}

const GEOFENCE_METERS = 60;

/**
 * Suggest a ride state from the driver's proximity to pickup/drop. Triggered by the seller's
 * drag (Change 5), so it remains user-driven. Returns undefined when no geofence matched.
 */
export function nextAutoState(
    driverGps: string | undefined,
    pickupGps: string | undefined,
    dropGps: string | undefined
): RideState | undefined {
    const driver = parseGps(driverGps);
    const pickup = parseGps(pickupGps);
    const drop = parseGps(dropGps);
    if (!driver) return undefined;
    if (drop && haversineMeters(driver, drop) <= GEOFENCE_METERS) return "RIDE_ENDED";
    if (pickup && haversineMeters(driver, pickup) <= GEOFENCE_METERS)
        return "RIDE_ARRIVED_PICKUP";
    return undefined;
}

// --- tolerant recursive extractors ------------------------------------------

/** Find the first array under key `stops` anywhere in the object tree. */
function findStops(obj: unknown): any[] | null {
    if (!obj || typeof obj !== "object") return null;
    const rec = obj as Record<string, unknown>;
    if (Array.isArray(rec.stops)) return rec.stops as any[];
    for (const v of Object.values(rec)) {
        const found = findStops(v);
        if (found) return found;
    }
    return null;
}

function stopGps(stops: any[] | null, type: string): string | undefined {
    if (!stops) return undefined;
    const s = stops.find((st) => st?.type === type);
    return s?.location?.gps;
}

/**
 * Find the CURRENT ride fulfillment-state code from an on_status/on_update/on_confirm payload.
 *
 * The mock's generate sets the live state at `…fulfillments[].state.descriptor.code`, but the
 * payload also carries an enumerated state list / `fulfillment_state` block that lists OTHER
 * RIDE_* codes (with RIDE_ASSIGNED first). A naive "first RIDE_* code anywhere" search wrongly
 * locks onto RIDE_ASSIGNED, so the buyer never advances. We therefore read the precise path first
 * (the LAST fulfillment's state.descriptor.code), and only fall back to a broad search if absent.
 */
function findRidePhase(obj: unknown): string | undefined {
    // 1) Precise: message.order.fulfillments[*].state.descriptor.code (what the generate updates).
    const collectStateCodes = (node: unknown, out: string[]): void => {
        if (!node || typeof node !== "object") return;
        const rec = node as Record<string, any>;
        const code = rec.state?.descriptor?.code;
        if (typeof code === "string" && code.startsWith("RIDE_")) out.push(code);
        for (const v of Object.values(rec)) collectStateCodes(v, out);
    };
    const precise: string[] = [];
    collectStateCodes(obj, precise);
    if (precise.length) return precise[precise.length - 1];

    // 2) Fallback: any RIDE_* `code` anywhere (older/looser payload shapes).
    const broad = (node: unknown): string | undefined => {
        if (!node || typeof node !== "object") return undefined;
        const rec = node as Record<string, any>;
        if (typeof rec.code === "string" && rec.code.startsWith("RIDE_")) return rec.code;
        for (const v of Object.values(rec)) {
            const f = broad(v);
            if (f) return f;
        }
        return undefined;
    };
    return broad(obj);
}

function findTrackingGps(obj: unknown): string | undefined {
    if (!obj || typeof obj !== "object") return undefined;
    const rec = obj as Record<string, any>;
    const gps = rec.tracking?.location?.gps;
    if (typeof gps === "string") return gps;
    for (const v of Object.values(rec)) {
        const found = findTrackingGps(v);
        if (found) return found;
    }
    return undefined;
}

/**
 * Across one or more step lists (sequence / extraSteps / missedSteps), return the payloadId of the
 * step whose API payload has the LATEST timestamp for the given actionType. Side-agnostic: a
 * received action may land in any list depending on which side recorded it.
 */
function latestPayloadId(stepLists: MappedStep[][], actionType: string): string | undefined {
    let bestId: string | undefined;
    let bestTs = -Infinity;
    for (const steps of stepLists) {
        for (const s of steps) {
            if (s.actionType !== actionType) continue;
            const payloads = s.payloads;
            if (payloads && payloads.entryType === "API" && payloads.payloads?.length) {
                const ts = new Date(payloads.timestamp).getTime();
                if (ts >= bestTs) {
                    bestTs = ts;
                    bestId = payloads.payloads[payloads.payloads.length - 1].payloadId;
                }
            }
        }
    }
    return bestId;
}

async function fetchReq(
    payloadId: string | undefined,
    cache: Map<string, any>
): Promise<any | undefined> {
    if (!payloadId) return undefined;
    if (cache.has(payloadId)) return cache.get(payloadId);
    try {
        const data = await getCompletePayload([payloadId]);
        const req = data?.[0]?.req;
        cache.set(payloadId, req);
        return req;
    } catch {
        return undefined;
    }
}

/**
 * Derive everything the map needs from the mapped flow. Tracking is considered
 * active once an on_confirm has completed (driver assigned) and remains so for
 * the duration of the ride. `cache` avoids refetching the same payload on polls.
 */
export async function deriveRideMapData(
    mappedFlow: FlowMap,
    cache: Map<string, any>
): Promise<RideMapData> {
    // Side-agnostic: a received action may be recorded in any of these lists. The provider (BPP)
    // doesn't record its own sends, so it relies on `confirm` (received from BAP); the buyer (BAP)
    // has `on_confirm`. Read across all three lists for everything.
    const lists = [
        mappedFlow.sequence ?? [],
        mappedFlow.extraSteps ?? [],
        mappedFlow.missedSteps ?? [],
    ];

    const isComplete = (actionType: string) =>
        lists.some((l) => l.some((s) => s.actionType === actionType && s.status === "COMPLETE"));

    // Tracking is active once the ride is confirmed — from EITHER side's view.
    if (!isComplete("on_confirm") && !isComplete("confirm")) {
        return { isTracking: false };
    }

    // Stops (pickup/drop) come from whichever confirmation payload this side has.
    const confirmReq = await fetchReq(
        latestPayloadId(lists, "on_confirm") ?? latestPayloadId(lists, "confirm"),
        cache
    );
    const trackReq = await fetchReq(latestPayloadId(lists, "on_track"), cache);
    const statusReq = await fetchReq(latestPayloadId(lists, "on_status"), cache);

    const stops = findStops(confirmReq);
    const pickupGps = stopGps(stops, "START");
    const dropGps = stopGps(stops, "END");
    const driverGps = findTrackingGps(trackReq);
    // Latest on_status phase; fall back to the confirmation state (RIDE_ASSIGNED).
    const phase = findRidePhase(statusReq) ?? findRidePhase(confirmReq);

    return {
        pickupGps,
        dropGps,
        driverGps,
        phase,
        isTracking: true,
    };
}
