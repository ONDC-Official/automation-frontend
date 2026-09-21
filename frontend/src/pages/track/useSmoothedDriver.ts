import { useEffect, useRef, useState } from "react";
import {
    parseGps,
    pointAlong,
    progressAlong,
    type LatLng,
} from "@components/DomainFlowRunner/RideMapUtils";

/**
 * How long the displayed position takes to converge on the projection, as an
 * exponential time constant. Low enough to feel responsive when a fix corrects
 * the estimate, high enough that the correction reads as a drift rather than a
 * jump.
 */
const SMOOTHING_TAU_MS = 500;

/**
 * How far past the newest fix the marker may keep travelling, as a multiple of
 * the expected gap between fixes. Beyond this the feed is considered stale and
 * the marker parks — a stopped car is a better wrong answer than one that
 * drives off on its own.
 */
const MAX_EXTRAPOLATE_FACTOR = 2;

/** Below this change in route fraction, re-rendering is not worth the frame. */
const MIN_VISIBLE_DELTA = 0.00002;

const prefersReducedMotion = (): boolean => {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
};

type Fix = { fraction: number; at: number };

/**
 * Smooths the observed driver position into continuous motion along the route.
 *
 * The workbench runner looks fluid because the seller *generates* the movement:
 * it knows the whole segment and redraws its own interpolation every 200ms. A
 * viewer of the public link only sees discrete `on_track` fixes, so matching
 * that feel means reconstructing the motion between them.
 *
 * Three things make it continuous rather than stop-start:
 *
 *   - **Linear, not eased.** A vehicle at constant speed must not decelerate
 *     into every fix; easing made the marker appear to park several times a leg.
 *   - **Dead reckoning.** Between fixes the marker keeps moving at the speed the
 *     last two fixes implied, so it never waits for the next one to arrive.
 *   - **Smooth correction.** When a fix disagrees with the projection, the
 *     displayed position converges on it exponentially instead of snapping.
 *
 * The projection is capped at {@link MAX_EXTRAPOLATE_FACTOR} fix intervals, so a
 * feed that stops leaves the marker parked rather than travelling on estimates
 * indefinitely.
 *
 * NOTE: between fixes this shows an *estimated* position, not an observed one.
 * That is a deliberate trade for a seller-issued view of a simulated ride.
 *
 * @param targetGps      newest observed position, as a TRV10 "lat, lng" string
 * @param route          road geometry the driver is travelling
 * @param fixIntervalMs  expected gap between fixes, used to bound extrapolation
 * @returns the position to draw, as a "lat, lng" string
 */
export function useSmoothedDriver(
    targetGps: string | undefined,
    route: LatLng[] | undefined,
    fixIntervalMs: number
): string | undefined {
    const [displayGps, setDisplayGps] = useState<string | undefined>(targetGps);

    const model = useRef<{
        path: LatLng[] | null;
        prev: Fix | null;
        last: Fix | null;
        display: number | null;
        frameAt: number | null;
    }>({ path: null, prev: null, last: null, display: null, frameAt: null });

    // Ingest each new fix: project it onto the route and remember when it landed,
    // so the loop below can infer speed from the last two.
    useEffect(() => {
        const m = model.current;
        const point = parseGps(targetGps);

        if (!targetGps || !point) {
            m.path = null;
            m.prev = m.last = null;
            m.display = null;
            setDisplayGps(undefined);
            return;
        }

        // A new segment invalidates every fraction measured against the old one.
        const path = route && route.length > 1 ? route : null;
        if (path !== m.path) {
            m.path = path;
            m.prev = m.last = null;
            m.display = null;
        }

        if (!m.path) {
            // No usable geometry — nothing to interpolate along.
            setDisplayGps(targetGps);
            return;
        }

        const fraction = progressAlong(m.path, point);
        const now = performance.now();

        // Ignore a repeat of the same position: it carries no new information and
        // would otherwise read as "speed dropped to zero".
        if (m.last && Math.abs(fraction - m.last.fraction) < MIN_VISIBLE_DELTA) return;

        m.prev = m.last;
        m.last = { fraction, at: now };
        if (m.display === null || prefersReducedMotion()) m.display = fraction;
    }, [targetGps, route]);

    // One continuous loop for the life of the component: the marker's motion is
    // driven by elapsed time, not by fix arrivals, which is what removes the
    // stall between them.
    useEffect(() => {
        if (prefersReducedMotion()) return;
        let frame: number | null = null;

        const tick = () => {
            const m = model.current;
            const now = performance.now();
            const dt = m.frameAt === null ? 0 : now - m.frameAt;
            m.frameAt = now;

            if (m.path && m.last && m.display !== null) {
                // Speed implied by the last two fixes, in route-fraction per ms.
                const speed =
                    m.prev && m.last.at > m.prev.at
                        ? (m.last.fraction - m.prev.fraction) / (m.last.at - m.prev.at)
                        : 0;

                // Where the driver probably is now — capped so a stale feed parks
                // the marker instead of letting it run away.
                const elapsed = Math.min(now - m.last.at, fixIntervalMs * MAX_EXTRAPOLATE_FACTOR);
                const projected = Math.min(1, m.last.fraction + Math.max(0, speed) * elapsed);

                // Converge on the projection rather than jumping to it, so a fix
                // that disagrees with the estimate corrects as a drift.
                const alpha = dt > 0 ? 1 - Math.exp(-dt / SMOOTHING_TAU_MS) : 0;
                const next = m.display + (projected - m.display) * alpha;

                if (Math.abs(next - m.display) >= MIN_VISIBLE_DELTA) {
                    m.display = next;
                    const p = pointAlong(m.path, next);
                    if (p) setDisplayGps(`${p[0]}, ${p[1]}`);
                }
            }

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            model.current.frameAt = null;
        };
    }, [fixIntervalMs]);

    return displayGps;
}
