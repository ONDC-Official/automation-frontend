import { useCallback, useEffect, useRef } from "react";

interface IUseResizableSplitOptions {
    defaultLeftPercent: number;
    minLeftPercent?: number;
    maxLeftPercent?: number;
}

const LEFT_WIDTH_VAR = "--pg-left-width";

export const useResizableSplit = (options: IUseResizableSplitOptions) => {
    const { defaultLeftPercent, minLeftPercent = 20, maxLeftPercent = 80 } = options;

    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const currentPercentRef = useRef(defaultLeftPercent);

    const applyLeftPercent = useCallback(
        (percent: number) => {
            const clamped = Math.min(maxLeftPercent, Math.max(minLeftPercent, percent));
            currentPercentRef.current = clamped;
            containerRef.current?.style.setProperty(LEFT_WIDTH_VAR, `${clamped}%`);
        },
        [minLeftPercent, maxLeftPercent]
    );

    useEffect(() => {
        applyLeftPercent(defaultLeftPercent);
    }, [defaultLeftPercent, applyLeftPercent]);

    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            applyLeftPercent(((event.clientX - rect.left) / rect.width) * 100);
        };
        const stopDragging = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            document.body.style.removeProperty("cursor");
            document.body.style.removeProperty("user-select");
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", stopDragging);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", stopDragging);
        };
    }, [applyLeftPercent]);

    const startDragging = useCallback(() => {
        isDraggingRef.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    const nudgeLeftPercent = useCallback(
        (deltaPercent: number) => {
            applyLeftPercent(currentPercentRef.current + deltaPercent);
        },
        [applyLeftPercent]
    );

    return { containerRef, startDragging, nudgeLeftPercent };
};
