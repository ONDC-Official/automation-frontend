import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectAiSettings, updateAiSettings } from "@store/slices/aiSlice";

import type { AiSettings } from "../context/ai-context";

export function useAiSettings() {
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectAiSettings);

    const updateSettings = useCallback(
        (patch: Partial<AiSettings>) => {
            dispatch(updateAiSettings(patch));
        },
        [dispatch]
    );

    return { settings, updateSettings };
}
