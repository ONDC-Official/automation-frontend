import { useContext } from "react";

import { AIContext } from "../context/ai-context";

export function useUnlockGate() {
    const ai = useContext(AIContext);
    return {
        ensureUnlocked: ai.ensureUnlocked,
        isUnlocked: ai.isUnlocked,
        isConfigured: ai.isConfigured,
    };
}
