import { useEffect, useRef, useState } from "react";
import {
    parseGps,
    pointAlong,
    progressAlong,
    type LatLng,
} from "@components/DomainFlowRunner/RideMapUtils";

/** Longest a single tween may run, however far apart two fixes land. */
const MAX_TWEEN_MS = 6000;

/** Below this the marker may as well snap — animating a metre reads as jitter. */
const MIN_FRACTION_DELTA = 0.0005;

const prefersReducedMotion = (): boolean => {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
};

/** Ease-out: quick off the mark, settling into the new fix rather than stopping dead. */
const ease = (t: number): number => 1 - (1 - t) * (1 - t);

/**
 * Smooths the observed driver position for a viewer who only sees discrete fixes.
 *
 * The workbench runner looks fluid because the seller *generates* the movement and
 * redraws its own interpolation every 200ms. A public viewer has no such knowledge —
 * it sees an `on_track` fix whenever one is polled, so the marker teleports.
 *
 * This closes that gap by animating between two consecutive fixes **along the route
 * polyline** rather than in a straight line, so the marker follows the road round
 * bends instead of cutting corners.
 *
 * Deliberately never extrapolates. When fixes stop arriving the tween completes and
 * the marker stays put: showing a position between two observations is a reasonable
 * reading of the data, inventing one beyond the last is not.
 *
 * @param targetGps the newest observed position, as a TRV10 "lat, lng" string
 * @param route     road geometry to travel along; a straight tween when absent
 * @param tweenMs   expected gap between fixes — how long a tween should take
 * @returns the position to draw, as a "lat, lng" string
 */
export function useSmoothedDriver(
    targetGps: string | undefined,
    route: LatLng[] | undefined,
    tweenMs: number
): string | undefined {
    const [displayGps, setDisplayGps] = useState<string | undefined>(targetGps);
    // Read inside the animation frame without re-subscribing the effect to every tick.
    const displayRef = useRef<string | undefined>(targetGps);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const stop = () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
        const snap = (gps: string | undefined) => {
            stop();
            displayRef.current = gps;
            setDisplayGps(gps);
        };

        if (!targetGps) return snap(undefined);

        const from = parseGps(displayRef.current);
        const to = parseGps(targetGps);
        // First fix, unparseable, or motion suppressed — show it as-is.
        if (!from || !to || !displayRef.current || prefersReducedMotion()) {
            return snap(targetGps);
        }

        // Project both fixes onto the route so the marker travels the road between
        // them. Without usable geometry, fall back to a straight two-point path.
        const path = route && route.length > 1 ? route : [from, to];
        const fromFraction = progressAlong(path, from);
        const toFraction = progressAlong(path, to);

        // Backwards or negligible movement — a reversing marker reads as a glitch,
        // and sub-metre drift is not worth animating.
        if (toFraction <= fromFraction + MIN_FRACTION_DELTA) {
            return snap(targetGps);
        }

        const duration = Math.min(Math.max(tweenMs, 0), MAX_TWEEN_MS);
        if (duration === 0) return snap(targetGps);

        const startedAt = performance.now();
        stop();
        const step = () => {
            const elapsed = performance.now() - startedAt;
            const t = Math.min(1, elapsed / duration);
            const fraction = fromFraction + (toFraction - fromFraction) * ease(t);
            const point = pointAlong(path, fraction);
            if (point) {
                const gps = `${point[0]}, ${point[1]}`;
                displayRef.current = gps;
                setDisplayGps(gps);
            }
            if (t < 1) {
                frameRef.current = requestAnimationFrame(step);
                return;
            }
            // Land exactly on the observed fix — never a rounding error away from it.
            snap(targetGps);
        };
        frameRef.current = requestAnimationFrame(step);

        return stop;
        // `route` identity changes only when the segment is rebuilt, which should
        // restart the tween — that is the intended behaviour.
    }, [targetGps, route, tweenMs]);

    return displayGps;
}
