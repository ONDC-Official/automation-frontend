import { type ReactNode, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getRevealTargets, isInView, revealElement } from "@components/Routes/utils";

/** Reveals each page child with a CSS ease-in as it scrolls into view. */
const PageReveal = ({ children }: { children: ReactNode }) => {
    const { pathname } = useLocation();
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) {
            return;
        }

        const targets = getRevealTargets(root);
        if (targets.length === 0) {
            return;
        }

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        targets.forEach((el) => {
            el.classList.add("page-reveal-child");
            el.classList.remove("is-revealed");
        });

        if (reduceMotion) {
            targets.forEach((el) => el.classList.add("is-revealed"));
            return;
        }

        // Reveal above-the-fold children; observe the rest on scroll
        const pending: HTMLElement[] = [];
        for (const el of targets) {
            if (isInView(el)) {
                revealElement(el);
            } else {
                pending.push(el);
            }
        }

        if (pending.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) {
                        continue;
                    }
                    revealElement(entry.target as HTMLElement);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );

        pending.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [pathname]);

    return (
        <div key={pathname} ref={ref} className="page-reveal flex min-h-0 flex-1 flex-col">
            {children}
        </div>
    );
};

export default PageReveal;
