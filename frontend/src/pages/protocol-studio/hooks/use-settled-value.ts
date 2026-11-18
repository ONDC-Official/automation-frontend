import { useEffect, useState } from "react";

/** `value`, once it has stopped changing for `delay` ms: keeps typing from redoing work per keystroke. */
export const useSettledValue = <T>(value: T, delay: number) => {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timer = window.setTimeout(() => setSettled(value), delay);
        return () => window.clearTimeout(timer);
    }, [value, delay]);
    return settled;
};

export default useSettledValue;
