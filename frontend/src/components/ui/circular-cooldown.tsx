import React, { useEffect, useRef, useState } from "react";
import { store } from "@store/index";
import { setCooldown, clearCooldown } from "@store/slices/cooldownsSlice";

interface Props {
    strokeWidth?: number;
    sqSize?: number;
    duration?: number; // in seconds
    onComplete: () => Promise<void>;
    loop: boolean;
    id?: string;
    isActive?: boolean;
}

const CircularProgress: React.FC<Props> = ({
    strokeWidth = 10,
    sqSize = 120,
    duration = 5,
    onComplete,
    loop,
    isActive = true,
    id,
}) => {
    const radius = (sqSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const [progress, setProgress] = useState<number>(() => {
        if (id) {
            return store.getState().cooldowns.entries[id]?.progress ?? 0;
        }
        return 0;
    });

    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const isMounted = useRef(true);
    const isRunning = useRef(false);
    const pauseRef = useRef(false);
    const [resumeKey, setResumeKey] = useState(0);

    useEffect(() => {
        isMounted.current = true;

        return () => {
            isMounted.current = false;
            isRunning.current = false;
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Background tabs throttle rAF — resume polling when the user returns.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState !== "visible" || !isActive) return;
            pauseRef.current = false;
            isRunning.current = false;
            startTimeRef.current = null;
            if (id) {
                store.dispatch(clearCooldown(id));
            }
            setProgress(0);
            setResumeKey((k) => k + 1);
        };

        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [isActive, id]);

    useEffect(() => {
        if (!isActive) return;
        if (pauseRef.current) return;
        isRunning.current = true;

        const savedElapsed = id ? (store.getState().cooldowns.entries[id]?.elapsed ?? 0) : 0;

        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!isRunning.current || !isMounted.current) return;

            if (!startTimeRef.current) {
                startTimeRef.current = timestamp - savedElapsed * 1000;
            }

            const elapsed = (timestamp - startTimeRef.current) / 1000;
            const currentProgress = Math.min(elapsed / duration, 1);

            setProgress(currentProgress);

            if (id) {
                store.dispatch(setCooldown({ id, progress: currentProgress, elapsed }));
            }

            if (currentProgress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                isRunning.current = false;

                // Clear stored cooldown progress
                if (id) {
                    store.dispatch(clearCooldown(id));
                }
                pauseRef.current = true;
                onComplete().finally(() => {
                    if (!isMounted.current) return;

                    isRunning.current = false;
                    startTimeRef.current = null;
                    pauseRef.current = false;
                });
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            isRunning.current = false;
        };
    }, [duration, loop, onComplete, isActive, id, resumeKey]);

    const strokeDashoffset = circumference * (1 - progress);

    if (!isActive) return null;

    return (
        <div className="flex items-center justify-center p-2 ml-2 rounded-md transition-transform transform hover:scale-105 focus:outline-hidden focus:ring-2 focus:ring-offset-2 text-sky-700 ease-in">
            <svg width={sqSize} height={sqSize}>
                <circle
                    cx={sqSize / 2}
                    cy={sqSize / 2}
                    r={radius}
                    stroke="#e6e6e6"
                    fill="none"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={sqSize / 2}
                    cy={sqSize / 2}
                    r={radius}
                    stroke="#0369a1"
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export default CircularProgress;
