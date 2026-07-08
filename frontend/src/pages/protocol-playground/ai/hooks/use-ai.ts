import { useMemo } from "react";
import { useAiSettings } from "./use-ai-settings";
import { useAiUnlockGate } from "./use-ai-unlock-gate";

/** AI settings (Redux) + unlock-gate state (module singleton, not persisted). */
export function useAi() {
    const { settings, updateSettings } = useAiSettings();
    const unlock = useAiUnlockGate();

    return useMemo(
        () => ({
            settings,
            updateSettings,
            isConfigured: unlock.isConfigured,
            isUnlocked: unlock.isUnlocked,
            refreshKeyStatus: unlock.refreshKeyStatus,
            openSetupModal: unlock.openSetupModal,
            openUnlockModal: unlock.openUnlockModal,
            closeAuthModals: unlock.closeAuthModals,
            ensureUnlocked: unlock.ensureUnlocked,
            lock: unlock.lock,
            clearKey: unlock.clearKey,
        }),
        [settings, updateSettings, unlock]
    );
}
