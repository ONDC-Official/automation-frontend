import { Context, createContext } from "react";

export type AiSettings = {
    endpoint: string;
    model: string;
    inlineCompletionEnabled: boolean;
    useProxy: boolean;
};

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
