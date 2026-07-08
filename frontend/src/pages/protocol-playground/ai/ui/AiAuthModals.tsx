import { useEffect } from "react";
import {
    ensureAiUnlockGateInitialized,
    teardownAiUnlockGate,
} from "../stores/ai-unlock-gate-store";
import { useAiUnlockGate } from "../hooks/use-ai-unlock-gate";
import { SetupKeyModal } from "./SetupKeyModal";
import { UnlockKeyModal } from "./UnlockKeyModal";

/** Mount once on the playground page — owns AI auth modals without React Context. */
export function AiAuthModals() {
    const {
        setupOpen,
        unlockOpen,
        closeAuthModals,
        handleSetupSuccess,
        handleUnlockSuccess,
        openSetupModal,
    } = useAiUnlockGate();

    useEffect(() => {
        ensureAiUnlockGateInitialized();
        return () => teardownAiUnlockGate();
    }, []);

    return (
        <>
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
        </>
    );
}
