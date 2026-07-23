import { useEffect, useState, type AnimationEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Duration for Developer Guide tab section slides. */
export const GUIDE_SECTION_SLIDE_MS = 375;

type SlideDirection = "forward" | "back";

type Layer = {
    key: string;
    node: ReactNode;
};

type GuideTabFadeProps = {
    /** Changes when the active section/tab changes — drives a directional slide. */
    activeKey: string;
    /** Visible tab ids in strip order — used to choose forward vs back. */
    tabOrder: string[];
    children: ReactNode;
    className?: string;
};

function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function resolveDirection(fromKey: string, toKey: string, tabOrder: string[]): SlideDirection {
    const fromIndex = tabOrder.indexOf(fromKey);
    const toIndex = tabOrder.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return "forward";
    return toIndex >= fromIndex ? "forward" : "back";
}

/**
 * Slides section content when `activeKey` changes based on `tabOrder`:
 * forward → exit left / enter from right; back → exit right / enter from left.
 * Pair with `GuideTabs` (strip stays fixed; only the panel animates).
 */
const GuideTabFade = ({ activeKey, tabOrder, children, className }: GuideTabFadeProps) => {
    const [current, setCurrent] = useState<Layer>(() => ({ key: activeKey, node: children }));
    const [outgoing, setOutgoing] = useState<Layer | null>(null);
    const [direction, setDirection] = useState<SlideDirection>("forward");
    const [animating, setAnimating] = useState(false);

    // Start slide during render so the first painted frame already has both layers.
    if (activeKey !== current.key) {
        if (prefersReducedMotion()) {
            setCurrent({ key: activeKey, node: children });
            setOutgoing(null);
            setAnimating(false);
        } else {
            setDirection(resolveDirection(current.key, activeKey, tabOrder));
            setOutgoing(current);
            setCurrent({ key: activeKey, node: children });
            setAnimating(true);
        }
    }

    // Safety: clear outgoing if animationend is missed.
    useEffect(() => {
        if (!animating) return;
        const timer = window.setTimeout(() => {
            setOutgoing(null);
            setAnimating(false);
        }, GUIDE_SECTION_SLIDE_MS + 50);
        return () => window.clearTimeout(timer);
    }, [animating, current.key]);

    const finish = (event: AnimationEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        if (!event.animationName.startsWith("guide-section-slide-in-")) return;
        setOutgoing(null);
        setAnimating(false);
    };

    const incomingNode = animating ? current.node : children;

    return (
        <div className={cn("relative overflow-hidden", className)} data-reveal-skip>
            {outgoing != null && (
                <div
                    key={`out-${outgoing.key}`}
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 z-10",
                        direction === "forward"
                            ? "guide-section-slide-out-forward"
                            : "guide-section-slide-out-back"
                    )}
                >
                    {outgoing.node}
                </div>
            )}
            <div
                key={`in-${current.key}`}
                className={cn(
                    "relative z-0 flex h-full min-h-0 w-full min-w-0 flex-1 flex-col",
                    animating &&
                        (direction === "forward"
                            ? "guide-section-slide-in-forward"
                            : "guide-section-slide-in-back")
                )}
                onAnimationEnd={finish}
            >
                {incomingNode}
            </div>
        </div>
    );
};

export default GuideTabFade;
