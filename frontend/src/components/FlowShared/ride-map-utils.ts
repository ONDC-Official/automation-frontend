import { FlowMap, MappedStep } from "@/types/flow-state-type";
import { getCompletePayload } from "@utils/request-utils";

/**
 * Real-Time Ride Map Integration — payload derivation helpers.
 *
 * The mapped flow only carries payload *ids*; the actual TRV10 message content
 * (stops, tracking GPS, fulfillment state) is fetched on demand and parsed here.
 * All parsing is tolerant (recursive search) since exact nesting varies by flow.
 */

export interface RideDriver {
    name?: string;
    phone?: string;
    rating?: string;
}
export interface RideVehicle {
    registration?: string;
    make?: string;
    model?: string;
    category?: string;
    color?: string;
}
export interface RideFare {
    value?: string;
    currency?: string;
}

export interface RideMapData {
    pickupGps?: string;
    dropGps?: string;
    driverGps?: string;
    phase?: string;
    isTracking: boolean;
    /** True once pickup & drop are known (from search onward) — enough to show the map preview. */
    hasLocations: boolean;
    /** `message.order.status` from the latest order-bearing payload (on_status/on_update/on_confirm/on_cancel). */
    orderStatus?: string;
    /** Error block (e.g. `{code:"90203", message:"Driver not assigned…"}`) from the latest payload. */
    error?: { code?: string; message?: string };
    driver?: RideDriver;
    vehicle?: RideVehicle;
    fare?: RideFare;
}

/**
 * The ride-map feature (Application tab + live map) is gated to a single domain/version so it
 * never appears for other ONDC domains. Matched against the session's `domain` + `version`.
 */
export const RIDE_MAP_DOMAIN = "ONDC:TRV10";
export const RIDE_MAP_VERSION = "2.1.0";
export const isRideMapEnabled = (domain?: string, version?: string): boolean =>
    domain === RIDE_MAP_DOMAIN && version === RIDE_MAP_VERSION;

/** What the map should display, derived purely from order.status + ride state (+ error). */
export type RideDisplayKind =
    | "DRIVER_NOT_FOUND"
    | "AWAITING_DRIVER"
    | "CANCELLED"
    | "CANCELLING"
    | "COMPLETED"
    | "ACTIVE"
    | "AWAITING";

export interface RideDisplay {
    kind: RideDisplayKind;
    title: string;
    detail?: string;
    /** Whether the seller's ride-state controls / driver simulation should be offered. */
    showsControls: boolean;
}

const RIDE_ACTIVE_STATES = new Set([
    "RIDE_ASSIGNED",
    "RIDE_ENROUTE_PICKUP",
    "RIDE_ARRIVED_PICKUP",
    "RIDE_STARTED",
    "RIDE_ENDED",
]);

/**
 * Decide what the map shows from the live order status + ride state (+ error). Priority order
 * matters — terminal/failure outcomes are checked before the active-ride case. Note `order.status`
 * stays ACTIVE through the whole ride (even at RIDE_COMPLETED), so completion is keyed off the
 * ride state, and the transient SOFT_UPDATE/UPDATED statuses are treated as active.
 */
export function deriveRideDisplay(input: {
    phase?: string;
    orderStatus?: string;
    error?: { code?: string; message?: string };
}): RideDisplay {
    const { phase, orderStatus, error } = input;
    const status = (orderStatus || "").toUpperCase();

    // 1) Driver never assigned (explicit error on on_confirm).
    const errMsg = (error?.message || "").toLowerCase();
    if (
        error &&
        (error.code === "90203" ||
            errMsg.includes("driver not assigned") ||
            errMsg.includes("driver not found"))
    ) {
        return {
            kind: "DRIVER_NOT_FOUND",
            title: "Driver not found",
            detail: error.message || "No driver was assigned to this order.",
            showsControls: false,
        };
    }

    // 2) Cancelled (hard) — ride state or order status.
    if (phase === "RIDE_CANCELLED" || status === "CANCELLED") {
        return {
            kind: "CANCELLED",
            title: "Ride cancelled",
            detail: "This ride was cancelled.",
            showsControls: false,
        };
    }

    // 3) Soft cancel requested (not yet final).
    if (status === "SOFT_CANCEL") {
        return {
            kind: "CANCELLING",
            title: "Cancellation in progress",
            detail: "A cancellation has been requested for this ride.",
            showsControls: false,
        };
    }

    // 4) Completed — keyed off ride state (order.status stays ACTIVE) or an explicit COMPLETE.
    if (phase === "RIDE_COMPLETED" || status === "COMPLETE" || status === "COMPLETED") {
        return { kind: "COMPLETED", title: "Ride completed", showsControls: false };
    }

    // 5) Confirmed but driver not yet assigned (assignment happens later via on_update).
    if (phase === "RIDE_CONFIRMED") {
        return {
            kind: "AWAITING_DRIVER",
            title: "Driver not assigned yet",
            detail: "The order is confirmed; a driver has not been assigned yet.",
            showsControls: false,
        };
    }

    // 6) Active ride (SOFT_UPDATE/UPDATED are transient → still active).
    if (phase && RIDE_ACTIVE_STATES.has(phase)) {
        return { kind: "ACTIVE", title: "Ride in progress", showsControls: true };
    }

    // 7) Nothing assigned yet (pre-confirm / awaiting).
    return { kind: "AWAITING", title: "Awaiting ride", showsControls: false };
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
    const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Timeline order + short labels for the status stepper (RIDE_ASSIGNED is set by on_confirm).
export const RIDE_TIMELINE = [
    "RIDE_ASSIGNED",
    "RIDE_ENROUTE_PICKUP",
    "RIDE_ARRIVED_PICKUP",
    "RIDE_STARTED",
    "RIDE_ENDED",
    "RIDE_COMPLETED",
] as const;
export const RIDE_TIMELINE_LABEL: Record<string, string> = {
    RIDE_ASSIGNED: "Assigned",
    RIDE_ENROUTE_PICKUP: "Enroute",
    RIDE_ARRIVED_PICKUP: "Arrived",
    RIDE_STARTED: "Started",
    RIDE_ENDED: "Ended",
    RIDE_COMPLETED: "Completed",
};

export const formatKm = (m?: number): string =>
    m == null ? "" : `${(m / 1000).toFixed(m < 1000 ? 2 : 1)} km`;
export const formatMin = (s?: number): string =>
    s == null ? "" : `${Math.max(1, Math.round(s / 60))} min`;

/** Closest point on segment a→b to p (planar approx), with its parametric t in [0,1]. */
function closestOnSegment(p: LatLng, a: LatLng, b: LatLng): { point: LatLng; t: number } {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return { point: [a[0] + dx * t, a[1] + dy * t], t };
}

/** Fraction (0..1) of the route the driver has covered — nearest point on the polyline. */
export function progressAlong(path: LatLng[], point: LatLng | null): number {
    if (!point || path.length < 2) return 0;
    const cum = [0];
    for (let i = 1; i < path.length; i++)
        cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
    const total = cum[cum.length - 1];
    if (total === 0) return 0;
    let bestDist = Infinity;
    let bestAlong = 0;
    for (let i = 1; i < path.length; i++) {
        const { point: cp, t } = closestOnSegment(point, path[i - 1], path[i]);
        const d = haversineMeters(point, cp);
        if (d < bestDist) {
            bestDist = d;
            bestAlong = cum[i - 1] + (cum[i] - cum[i - 1]) * t;
        }
    }
    return Math.max(0, Math.min(1, bestAlong / total));
}

/** Split a polyline at `fraction` into [covered, remaining] for two-tone rendering. */
export function splitPathAt(path: LatLng[], fraction: number): [LatLng[], LatLng[]] {
    if (path.length < 2) return [path, []];
    const cum = [0];
    for (let i = 1; i < path.length; i++)
        cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
    const total = cum[cum.length - 1];
    if (total === 0) return [path, []];
    const target = Math.max(0, Math.min(1, fraction)) * total;
    const covered: LatLng[] = [path[0]];
    for (let i = 1; i < path.length; i++) {
        if (cum[i] < target) {
            covered.push(path[i]);
        } else {
            const segLen = cum[i] - cum[i - 1];
            const t = segLen ? (target - cum[i - 1]) / segLen : 0;
            const a = path[i - 1];
            const b = path[i];
            const mid: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            covered.push(mid);
            return [covered, [mid, ...path.slice(i)]];
        }
    }
    return [covered, []];
}

/** Position at `fraction` (0..1) of the total length along a polyline path — drives animation. */
export function pointAlong(path: LatLng[], fraction: number): LatLng | null {
    if (!path || path.length === 0) return null;
    if (path.length === 1) return path[0];
    const cum = [0];
    for (let i = 1; i < path.length; i++)
        cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
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
export function stepToRideState(
    actionType: string,
    actionId: string
): RideState | "RIDE_ASSIGNED" | undefined {
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
    if (pickup && haversineMeters(driver, pickup) <= GEOFENCE_METERS) return "RIDE_ARRIVED_PICKUP";
    return undefined;
}

// --- tolerant recursive extractors ------------------------------------------

const asRecord = (v: unknown): Record<string, unknown> | undefined =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : undefined;

/** Find the first array under key `stops` anywhere in the object tree. */
function findStops(obj: unknown): unknown[] | null {
    const rec = asRecord(obj);
    if (!rec) return null;
    if (Array.isArray(rec.stops)) return rec.stops;
    for (const v of Object.values(rec)) {
        const found = findStops(v);
        if (found) return found;
    }
    return null;
}

function stopGps(stops: unknown[] | null, type: string): string | undefined {
    if (!stops) return undefined;
    const s = asRecord(stops.find((st) => asRecord(st)?.type === type));
    const location = asRecord(s?.location);
    return typeof location?.gps === "string" ? location.gps : undefined;
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
        const rec = asRecord(node);
        if (!rec) return;
        const code = asRecord(asRecord(rec.state)?.descriptor)?.code;
        if (typeof code === "string" && code.startsWith("RIDE_")) out.push(code);
        for (const v of Object.values(rec)) collectStateCodes(v, out);
    };
    const precise: string[] = [];
    collectStateCodes(obj, precise);
    if (precise.length) return precise[precise.length - 1];

    // 2) Fallback: any RIDE_* `code` anywhere (older/looser payload shapes).
    const broad = (node: unknown): string | undefined => {
        const rec = asRecord(node);
        if (!rec) return undefined;
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
    const rec = asRecord(obj);
    if (!rec) return undefined;
    const gps = asRecord(asRecord(rec.tracking)?.location)?.gps;
    if (typeof gps === "string") return gps;
    for (const v of Object.values(rec)) {
        const found = findTrackingGps(v);
        if (found) return found;
    }
    return undefined;
}

/** First value found under `key` anywhere in the object tree. */
function findByKey(obj: unknown, key: string): unknown {
    const rec = asRecord(obj);
    if (!rec) return undefined;
    if (rec[key] !== undefined && rec[key] !== null) return rec[key];
    for (const v of Object.values(rec)) {
        const found = findByKey(v, key);
        if (found !== undefined) return found;
    }
    return undefined;
}

/** Pull driver (agent), vehicle and fare (quote.price) details from a confirm/on_status payload. */
function extractRideInfo(payload: unknown): {
    driver?: RideDriver;
    vehicle?: RideVehicle;
    fare?: RideFare;
} {
    const agent = asRecord(findByKey(payload, "agent"));
    const vehicle = asRecord(findByKey(payload, "vehicle"));
    const price = asRecord(findByKey(payload, "price")); // quote.price
    const rating = findByKey(agent, "rating") ?? findByKey(payload, "rating");

    const person = asRecord(agent?.person);
    const contact = asRecord(agent?.contact);
    const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

    const driver: RideDriver | undefined =
        agent || rating
            ? {
                  name: asString(person?.name),
                  phone: asString(contact?.phone),
                  rating:
                      typeof rating === "string" || typeof rating === "number"
                          ? String(rating)
                          : undefined,
              }
            : undefined;
    const veh: RideVehicle | undefined = vehicle
        ? {
              registration: asString(vehicle.registration),
              make: asString(vehicle.make),
              model: asString(vehicle.model),
              category: asString(vehicle.category),
              color: asString(vehicle.color),
          }
        : undefined;
    const fare: RideFare | undefined =
        price && (price.value != null || price.currency != null)
            ? {
                  value: price.value != null ? String(price.value) : undefined,
                  currency: asString(price.currency),
              }
            : undefined;

    return { driver, vehicle: veh, fare };
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

/**
 * The payloadId of the single LATEST (by timestamp) API payload across several actionTypes.
 * Used to find the most recent "order-bearing" call (on_status/on_update/on_confirm/on_cancel) so
 * the ride state + order status reflect the true current state — `on_track` is excluded because it
 * carries only tracking GPS, no order/state.
 */
function latestPayloadIdAcross(
    stepLists: MappedStep[][],
    actionTypes: string[]
): string | undefined {
    const wanted = new Set(actionTypes);
    let bestId: string | undefined;
    let bestTs = -Infinity;
    for (const steps of stepLists) {
        for (const s of steps) {
            if (!wanted.has(s.actionType)) continue;
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

/** Find `message.order.status` anywhere in the object tree (first `order` object with a string status). */
function findOrderStatus(obj: unknown): string | undefined {
    const rec = asRecord(obj);
    if (!rec) return undefined;
    const order = asRecord(rec.order);
    if (typeof order?.status === "string") return order.status;
    for (const v of Object.values(rec)) {
        const found = findOrderStatus(v);
        if (found) return found;
    }
    return undefined;
}

/** Find an `error` block carrying a code/message anywhere in the object tree. */
function findError(obj: unknown): { code?: string; message?: string } | undefined {
    const rec = asRecord(obj);
    if (!rec) return undefined;
    const error = asRecord(rec.error);
    if (error && (error.code != null || error.message != null)) {
        return {
            code: error.code != null ? String(error.code) : undefined,
            message: typeof error.message === "string" ? error.message : undefined,
        };
    }
    for (const v of Object.values(rec)) {
        const found = findError(v);
        if (found) return found;
    }
    return undefined;
}

async function fetchReq(
    payloadId: string | undefined,
    cache: Map<string, unknown>
): Promise<unknown | undefined> {
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
    cache: Map<string, unknown>
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

    // Tracking (driver simulation + state controls) is active once the ride is confirmed.
    const isTracking = isComplete("on_confirm") || isComplete("confirm");

    // Stops (pickup/drop) come from whichever confirmation payload this side has.
    const confirmReq = await fetchReq(
        latestPayloadId(lists, "on_confirm") ?? latestPayloadId(lists, "confirm"),
        cache
    );

    // For the early preview (before confirm), pull pickup/drop from the first available payload in
    // the chain — search/select/init carry the entered start & end locations. This lets the map
    // render the moment the user enters start/end, on both buyer and seller sides.
    let stops = findStops(confirmReq);
    if (!stops) {
        const LOCATION_ACTIONS = ["on_select", "select", "on_init", "init", "on_search", "search"];
        for (const action of LOCATION_ACTIONS) {
            const req = await fetchReq(latestPayloadId(lists, action), cache);
            const found = findStops(req);
            if (found) {
                stops = found;
                break;
            }
        }
    }
    const pickupGps = stopGps(stops, "START");
    const dropGps = stopGps(stops, "END");
    const hasLocations = !!(pickupGps && dropGps);

    // Driver / state details only exist once the ride is confirmed; skip those fetches in preview.
    if (!isTracking) {
        return { pickupGps, dropGps, hasLocations, isTracking: false };
    }

    const trackReq = await fetchReq(latestPayloadId(lists, "on_track"), cache);

    // Latest ORDER-bearing payload (on_status/on_update/on_confirm/on_cancel + their request
    // counterparts) — drives the ride state, order status and any error. Crucially this includes
    // on_update (post-confirm driver assignment + soft states) and on_cancel (RIDE_CANCELLED),
    // which the previous on_status-only derivation could not see. on_track is excluded — it carries
    // only tracking GPS.
    const ORDER_ACTIONS = [
        "on_status",
        "on_update",
        "on_confirm",
        "on_cancel",
        "confirm",
        "status",
        "update",
        "cancel",
    ];
    const orderReq = await fetchReq(latestPayloadIdAcross(lists, ORDER_ACTIONS), cache);

    const driverGps = findTrackingGps(trackReq);
    // Ride state / order status / error from the latest order payload; fall back to confirmation.
    const phase = findRidePhase(orderReq) ?? findRidePhase(confirmReq);
    const orderStatus = findOrderStatus(orderReq) ?? findOrderStatus(confirmReq);
    const error = findError(orderReq) ?? findError(confirmReq);

    // Driver / vehicle / fare — prefer the confirmation payload, fall back to the latest order payload.
    const infoFromConfirm = extractRideInfo(confirmReq);
    const infoFromOrder = extractRideInfo(orderReq);
    const driver = infoFromConfirm.driver ?? infoFromOrder.driver;
    const vehicle = infoFromConfirm.vehicle ?? infoFromOrder.vehicle;
    const fare = infoFromConfirm.fare ?? infoFromOrder.fare;

    return {
        pickupGps,
        dropGps,
        driverGps,
        phase,
        isTracking: true,
        hasLocations,
        orderStatus,
        error,
        driver,
        vehicle,
        fare,
    };
}
