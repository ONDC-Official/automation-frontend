import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Browser fullscreen for one element, tracking exits made with Esc or the browser UI.
 * Toggling while another element is fullscreen takes this one fullscreen on top
 * (the code popup over a fullscreen editor); leaving it returns to the other.
 */
export const useFullscreen = (ref: RefObject<HTMLElement | null>) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
        document.addEventListener("fullscreenchange", handleChange);
        return () => document.removeEventListener("fullscreenchange", handleChange);
    }, [ref]);

    const toggle = useCallback(() => {
        const request =
            document.fullscreenElement && document.fullscreenElement === ref.current
                ? document.exitFullscreen()
                : ref.current?.requestFullscreen();
        request?.catch((error: unknown) => console.warn("Fullscreen toggle failed", error));
    }, [ref]);

    return { isFullscreen, toggle };
};

export default useFullscreen;
