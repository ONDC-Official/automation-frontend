import { useMemo, useSyncExternalStore } from "react";
import {
    clearAiKey,
    closeAiAuthModals,
    ensureAiUnlocked,
    getAiUnlockGateSnapshot,
    handleAiSetupSuccess,
    handleAiUnlockSuccess,
    lockAiSession,
    openAiSetupModal,
    openAiUnlockModal,
    refreshAiKeyStatus,
    subscribeAiUnlockGate,
    type UnlockGateResult,
} from "../stores/ai-unlock-gate-store";

export type { UnlockGateResult };

export function useAiUnlockGate() {
    const snapshot = useSyncExternalStore(
        subscribeAiUnlockGate,
        getAiUnlockGateSnapshot,
        getAiUnlockGateSnapshot
    );

    return useMemo(
        () => ({
            isConfigured: snapshot.isConfigured,
            isUnlocked: snapshot.isUnlocked,
            setupOpen: snapshot.setupOpen,
            unlockOpen: snapshot.unlockOpen,
            refreshKeyStatus: refreshAiKeyStatus,
            openSetupModal: openAiSetupModal,
            openUnlockModal: openAiUnlockModal,
            closeAuthModals: closeAiAuthModals,
            ensureUnlocked: ensureAiUnlocked,
            lock: lockAiSession,
            clearKey: clearAiKey,
            handleSetupSuccess: handleAiSetupSuccess,
            handleUnlockSuccess: handleAiUnlockSuccess,
        }),
        [snapshot]
    );
}
