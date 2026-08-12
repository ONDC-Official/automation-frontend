import { useEffect, useRef, useState } from "react";

/**
 * Local echo of a value that actually lives in the URL.
 *
 * The filter controls are fully controlled off `searchParams`, and react-router
 * commits URL state inside a React transition — so the rendered `value` prop
 * lags the address bar by a frame or more under load. That breaks Radix Select:
 * in controlled mode `useControllableState` fires `onValueChange` only when the
 * picked value differs from the currently rendered prop
 * (`if (value2 !== prop) onChangeRef.current?.(value2)`). Pick BAP, then clear
 * the filter before the transition commits, and the clear is compared against a
 * prop that still says "any" — so it is dropped silently and the control snaps
 * back. That is the "sometimes the role filter just does nothing".
 *
 * Holding the picked value locally makes the control authoritative the instant
 * it is used, and reconciles when the URL catches up. External changes — Reset,
 * browser back, a shared link — still win, which is why the last value we
 * emitted is tracked separately: it lets us tell "the URL changed underneath us"
 * apart from "the URL is echoing our own pick back".
 */
export function useOptimisticValue<T>(external: T): [T, (next: T) => void] {
    const [local, setLocal] = useState(external);
    const emitted = useRef(external);

    useEffect(() => {
        if (external !== emitted.current) {
            emitted.current = external;
            setLocal(external);
        }
    }, [external]);

    const set = (next: T) => {
        emitted.current = next;
        setLocal(next);
    };

    return [local, set];
}

export default useOptimisticValue;
