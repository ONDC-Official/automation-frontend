import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Spinner from "@components/Shadcn/Spinner";

/**
 * Full-viewport loading mask. Portaled to body (or the fullscreen element) so
 * ancestor transforms — e.g. PageReveal's `page-reveal-child` — cannot turn
 * `position: fixed` into a content-area-relative overlay that leaves the app
 * header / side panels uncovered.
 */
const LoadingOverlay = () => {
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );

    useEffect(() => {
        const update = () => {
            setPortalTarget(document.fullscreenElement ?? document.body);
        };
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, []);

    return createPortal(
        <div
            role="status"
            aria-live="polite"
            aria-label="Loading"
            data-reveal-skip
            className="fixed inset-0 z-70 flex h-svh w-svw items-center justify-center bg-neutral-900/40 backdrop-blur-xs"
        >
            <Spinner className="size-8 text-brand-normal" />
        </div>,
        portalTarget
    );
};

export default LoadingOverlay;
