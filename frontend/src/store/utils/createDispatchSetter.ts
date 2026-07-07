import type { Dispatch, SetStateAction } from "react";

/**
 * Bridges a React-style setState API (`setX(value)` or `setX(prev => next)`) onto a Redux
 * dispatch, so existing Context consumers that call setters keep working unchanged while the
 * source of truth lives in the store.
 */
export function createDispatchSetter<T>(
    current: T,
    onNext: (next: T) => void
): Dispatch<SetStateAction<T>> {
    return (value) => {
        const next = typeof value === "function" ? (value as (prev: T) => T)(current) : value;
        if (Object.is(next, current)) return;
        onNext(next);
    };
}
