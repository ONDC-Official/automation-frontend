import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectIsDark,
    selectResolvedTheme,
    selectThemePreference,
    setPreference as setPreferenceAction,
    setTheme as setThemeAction,
    toggleTheme as toggleThemeAction,
} from "@store/slices/themeSlice";
import type { ThemeValue } from "@/theme/types";

/** Theme preference and actions — backed by `themeSlice` (no Context). */
export const useTheme = (): ThemeValue => {
    const dispatch = useAppDispatch();
    const preference = useAppSelector(selectThemePreference);
    const resolvedTheme = useAppSelector(selectResolvedTheme);
    const isDark = useAppSelector(selectIsDark);

    const setPreference = useCallback(
        (next: ThemeValue["preference"]) => {
            dispatch(setPreferenceAction(next));
        },
        [dispatch]
    );

    const setTheme = useCallback(
        (theme: ThemeValue["resolvedTheme"]) => {
            dispatch(setThemeAction(theme));
        },
        [dispatch]
    );

    const toggleTheme = useCallback(() => {
        dispatch(toggleThemeAction());
    }, [dispatch]);

    return {
        preference,
        resolvedTheme,
        isDark,
        setPreference,
        setTheme,
        toggleTheme,
    };
};
