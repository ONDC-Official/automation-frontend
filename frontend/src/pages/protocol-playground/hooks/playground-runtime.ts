import { createContext, createElement, useContext, type ReactNode } from "react";
import type { PlaygroundRuntimeValue } from "@pages/protocol-playground/types/playground-runtime";

const PlaygroundRuntimeContext = createContext<PlaygroundRuntimeValue | null>(null);

export function PlaygroundRuntimeProvider({
    value,
    children,
}: {
    value: PlaygroundRuntimeValue;
    children: ReactNode;
}) {
    return createElement(PlaygroundRuntimeContext.Provider, { value }, children);
}

export function usePlayground(): PlaygroundRuntimeValue {
    const runtime = useContext(PlaygroundRuntimeContext);
    if (!runtime) {
        throw new Error("usePlayground must be used within the protocol playground route");
    }
    return runtime;
}
