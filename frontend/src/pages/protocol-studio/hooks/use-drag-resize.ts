import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
} from "react";

export interface IUseDragResizeOptions {
    /** Element that owns the CSS variable; it also gets `data-resizing` while dragging. */
    targetRef: RefObject<HTMLElement | null>;
    /** CSS custom property the panel reads its size from, e.g. `--studio-inspector-w`. */
    cssVar: string;
    axis: "x" | "y";
    /** `-1` for a panel anchored to the right/bottom edge, where dragging toward the origin grows it. */
    direction: 1 | -1;
    initial: number;
    min: number;
    /** Upper bound in px for the current container size. Pass a stable (module-level) function. */
    max: (container: HTMLElement) => number;
    keyboardStep?: number;
}

/**
 * Pointer + keyboard resizing for a panel whose size lives in a CSS variable.
 * While dragging, the variable is written directly (once per frame) so the
 * editor does not re-render; the React `size` is committed on release.
 */
export const useDragResize = ({
    targetRef,
    cssVar,
    axis,
    direction,
    initial,
    min,
    max,
    keyboardStep = 16,
}: IUseDragResizeOptions) => {
    const [bounds, setBounds] = useState({ size: initial, max: initial });
    const sizeRef = useRef(initial);
    const dragRef = useRef<{ start: number; startSize: number } | null>(null);
    const pendingRef = useRef<number | null>(null);
    const frameRef = useRef<number | null>(null);

    const upperBound = useCallback(() => {
        const container = targetRef.current;
        return container ? Math.max(min, max(container)) : Number.POSITIVE_INFINITY;
    }, [targetRef, min, max]);

    const apply = useCallback(
        (value: number) => {
            sizeRef.current = value;
            targetRef.current?.style.setProperty(cssVar, `${value}px`);
        },
        [targetRef, cssVar]
    );

    const commit = useCallback(
        (value: number) => {
            const upper = upperBound();
            const next = Math.min(Math.max(value, min), upper);
            apply(next);
            setBounds({ size: next, max: Number.isFinite(upper) ? upper : next });
        },
        [apply, upperBound, min]
    );

    // Set the variable before first paint, and keep it in range as the window resizes.
    useLayoutEffect(() => {
        commit(initial);
    }, []);

    useEffect(() => {
        const onResize = () => commit(sizeRef.current);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [commit]);

    const position = (e: PointerEvent<HTMLElement>) => (axis === "x" ? e.clientX : e.clientY);

    const onPointerDown = (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { start: position(e), startSize: sizeRef.current };
        targetRef.current?.setAttribute("data-resizing", axis);
    };

    const onPointerMove = (e: PointerEvent<HTMLElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const raw = drag.startSize + (position(e) - drag.start) * direction;
        pendingRef.current = Math.min(Math.max(raw, min), upperBound());
        if (frameRef.current !== null) return;
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            if (pendingRef.current !== null) apply(pendingRef.current);
        });
    };

    const endDrag = (e: PointerEvent<HTMLElement>) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        targetRef.current?.removeAttribute("data-resizing");
        commit(pendingRef.current ?? sizeRef.current);
        pendingRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        const grow = axis === "x" ? "ArrowRight" : "ArrowDown";
        const shrink = axis === "x" ? "ArrowLeft" : "ArrowUp";
        if (e.key === grow || e.key === shrink) {
            e.preventDefault();
            const sign = e.key === grow ? 1 : -1;
            commit(sizeRef.current + sign * direction * keyboardStep);
        } else if (e.key === "Home") {
            e.preventDefault();
            commit(min);
        } else if (e.key === "End") {
            e.preventDefault();
            commit(upperBound());
        }
    };

    return {
        size: bounds.size,
        handleProps: {
            role: "separator" as const,
            tabIndex: 0,
            // A vertical bar resizes along x, a horizontal bar along y.
            "aria-orientation": axis === "x" ? ("vertical" as const) : ("horizontal" as const),
            "aria-valuenow": Math.round(bounds.size),
            "aria-valuemin": min,
            "aria-valuemax": Math.round(bounds.max),
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onKeyDown,
            onDoubleClick: () => commit(initial),
        },
    };
};

export default useDragResize;
