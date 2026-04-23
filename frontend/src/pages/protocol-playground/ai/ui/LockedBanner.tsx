import { useContext } from "react";

import { AIContext } from "../context/ai-context";

export function LockedBanner() {
    const ai = useContext(AIContext);

    if (ai.isUnlocked) return null;

    const configured = ai.isConfigured;

    return (
        <div className="rounded border border-sky-200 bg-sky-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-sky-900">
                {configured
                    ? "AI key is locked for this session. Unlock to start chatting."
                    : "No AI key configured yet. Set one up to enable chat and autocomplete."}
            </div>
            <button
                type="button"
                onClick={configured ? ai.openUnlockModal : ai.openSetupModal}
                className="shrink-0 px-3 py-1.5 text-sm rounded bg-sky-600 text-white hover:bg-sky-700"
            >
                {configured ? "Unlock" : "Set up"}
            </button>
        </div>
    );
}
