import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    clearKey as clearSecureKey,
    isConfigured as isKeyConfigured,
    isUnlocked as isKeyUnlocked,
    lock as lockSecureKey,
    onLock as onSecureLock,
} from "@utils/secure-key-store";

import { useAiSettings } from "../hooks/use-ai-settings";
import { SetupKeyModal } from "../ui/SetupKeyModal";
import { UnlockKeyModal } from "../ui/UnlockKeyModal";
import { AIContext, type UnlockGateResult } from "./ai-context";

type PendingGate = {
    resolve: (result: UnlockGateResult) => void;
};

export function AIProvider({ children }: { children: ReactNode }) {
    const { settings, updateSettings } = useAiSettings();

    const [configured, setConfigured] = useState(false);
    const [unlocked, setUnlocked] = useState(isKeyUnlocked());
    const [setupOpen, setSetupOpen] = useState(false);
    const [unlockOpen, setUnlockOpen] = useState(false);
    const pendingGateRef = useRef<PendingGate | null>(null);

    const refreshKeyStatus = useCallback(async () => {
        const cfg = await isKeyConfigured();
        setConfigured(cfg);
        setUnlocked(isKeyUnlocked());
    }, []);

    useEffect(() => {
        void refreshKeyStatus();
    }, [refreshKeyStatus]);

    useEffect(() => {
        return onSecureLock(() => setUnlocked(false));
    }, []);

    const resolvePendingGate = useCallback((result: UnlockGateResult) => {
        const pending = pendingGateRef.current;
        if (pending) {
            pendingGateRef.current = null;
            pending.resolve(result);
        }
    }, []);

    const closeAuthModals = useCallback(() => {
        setSetupOpen(false);
        setUnlockOpen(false);
        resolvePendingGate("cancelled");
    }, [resolvePendingGate]);

    const handleSetupSuccess = useCallback(() => {
        setSetupOpen(false);
        setConfigured(true);
        setUnlocked(true);
        resolvePendingGate("unlocked");
    }, [resolvePendingGate]);

    const handleUnlockSuccess = useCallback(() => {
        setUnlockOpen(false);
        setUnlocked(true);
        resolvePendingGate("unlocked");
    }, [resolvePendingGate]);

    const openSetupModal = useCallback(() => {
        setUnlockOpen(false);
        setSetupOpen(true);
    }, []);

    const openUnlockModal = useCallback(() => {
        setSetupOpen(false);
        setUnlockOpen(true);
    }, []);

    const ensureUnlocked = useCallback(async (): Promise<UnlockGateResult> => {
        if (isKeyUnlocked()) {
            return "unlocked";
        }
        const cfg = await isKeyConfigured();
        setConfigured(cfg);
        return new Promise<UnlockGateResult>((resolve) => {
            // If a gate is already pending, cancel the previous waiter.
            if (pendingGateRef.current) {
                pendingGateRef.current.resolve("cancelled");
            }
            pendingGateRef.current = { resolve };
            if (cfg) {
                setUnlockOpen(true);
            } else {
                setSetupOpen(true);
            }
        });
    }, []);

    const lock = useCallback(() => {
        lockSecureKey();
        setUnlocked(false);
    }, []);

    const clearKey = useCallback(async () => {
        await clearSecureKey();
        setConfigured(false);
        setUnlocked(false);
    }, []);

    const value = useMemo(
        () => ({
            settings,
            updateSettings,
            isConfigured: configured,
            isUnlocked: unlocked,
            refreshKeyStatus,
            openSetupModal,
            openUnlockModal,
            closeAuthModals,
            ensureUnlocked,
            lock,
            clearKey,
        }),
        [
            settings,
            updateSettings,
            configured,
            unlocked,
            refreshKeyStatus,
            openSetupModal,
            openUnlockModal,
            closeAuthModals,
            ensureUnlocked,
            lock,
            clearKey,
        ]
    );

    return (
        <AIContext.Provider value={value}>
            {children}
            <SetupKeyModal
                isOpen={setupOpen}
                onClose={closeAuthModals}
                onSuccess={handleSetupSuccess}
            />
            <UnlockKeyModal
                isOpen={unlockOpen}
                onClose={closeAuthModals}
                onSuccess={handleUnlockSuccess}
                onSwitchToSetup={openSetupModal}
            />
        </AIContext.Provider>
    );
}
