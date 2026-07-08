import { useAiUnlockGate } from "./use-ai-unlock-gate";

export function useUnlockGate() {
    const ai = useAiUnlockGate();
    return {
        ensureUnlocked: ai.ensureUnlocked,
        isUnlocked: ai.isUnlocked,
        isConfigured: ai.isConfigured,
    };
}
