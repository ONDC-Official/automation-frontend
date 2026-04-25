import { useCallback, useEffect, useState } from "react";

import { localStorageManager } from "@utils/localStorageManager";

import { AI_SETTINGS_LS_KEY, DEFAULT_AI_SETTINGS } from "../constants";
import type { AiSettings } from "../context/ai-context";

export function useAiSettings() {
    const [settings, setSettings] = useState<AiSettings>(() => {
        const stored = localStorageManager.getItem<Partial<AiSettings>>(AI_SETTINGS_LS_KEY);
        return { ...DEFAULT_AI_SETTINGS, ...(stored ?? {}) };
    });

    useEffect(() => {
        localStorageManager.setItem<AiSettings>(AI_SETTINGS_LS_KEY, settings);
    }, [settings]);

    const updateSettings = useCallback((patch: Partial<AiSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    }, []);

    return { settings, updateSettings };
}
