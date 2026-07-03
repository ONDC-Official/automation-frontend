import { Context, createContext } from "react";

// Canonical type lives in the Redux slice (the settings' actual owner).
export type { AiSettings } from "@store/slices/aiSlice";
import type { AiSettings } from "@store/slices/aiSlice";

export type UnlockGateResult = "unlocked" | "cancelled";

export interface AIContextProps {
    settings: AiSettings;
    updateSettings: (patch: Partial<AiSettings>) => void;

    isConfigured: boolean;
    isUnlocked: boolean;
    refreshKeyStatus: () => Promise<void>;

    openSetupModal: () => void;
    openUnlockModal: () => void;
    closeAuthModals: () => void;
    ensureUnlocked: () => Promise<UnlockGateResult>;
    lock: () => void;
    clearKey: () => Promise<void>;
}

export const AIContext: Context<AIContextProps> = createContext<AIContextProps>(
    {} as AIContextProps
);
