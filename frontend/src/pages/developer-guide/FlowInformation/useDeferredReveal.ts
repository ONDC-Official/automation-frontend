import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Defers flipping `visible` to true until two animation frames have elapsed,
 * so a loader can paint before the heavy content underneath it mounts.
 */
export function useDeferredReveal() {
    const [visible, setVisible] = useState(true);
    const rafRef = useRef<number | null>(null);

    const schedule = useCallback(() => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        setVisible(false);
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = requestAnimationFrame(() => {
                setVisible(true);
                rafRef.current = null;
            });
        });
    }, []);

    const hide = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return { visible, schedule, hide };
}
