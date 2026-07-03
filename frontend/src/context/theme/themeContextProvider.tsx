import { useCallback, useEffect, useMemo, useRef, createContext, type ReactNode } from "react";
import {
    ThemePreference,
    ResolvedTheme,
    ThemeContextValue,
} from "@/context/theme/themeContextTypes";
import { applyThemeToDocument, resolveTheme } from "@/context/theme/themeUtils";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectThemePreference,
    setPreference as setPreferenceAction,
    setTheme as setThemeAction,
    toggleTheme as toggleThemeAction,
} from "@store/slices/themeSlice";

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
/**
 * Thin shell over the Redux `theme` slice. State lives in the store (persisted); this provider
 * keeps the same Context API for existing consumers and applies the theme to the document.
 * Ant Design is not coupled here — ready for a future shadcn migration.
 */
export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useAppDispatch();
    const preference = useAppSelector(selectThemePreference);

    const resolvedTheme = useMemo(() => resolveTheme(preference), [preference]);
    const isInitialMount = useRef(true);

    useEffect(() => {
        applyThemeToDocument(resolvedTheme, { animate: !isInitialMount.current });
        isInitialMount.current = false;
    }, [resolvedTheme]);

    const setPreference = useCallback(
        (next: ThemePreference) => {
            dispatch(setPreferenceAction(next));
        },
        [dispatch]
    );

    const setTheme = useCallback(
        (theme: ResolvedTheme) => {
            dispatch(setThemeAction(theme));
        },
        [dispatch]
    );

    const toggleTheme = useCallback(() => {
        dispatch(toggleThemeAction());
    }, [dispatch]);

    const value = useMemo<ThemeContextValue>(
        () => ({
            preference,
            resolvedTheme,
            isDark: resolvedTheme === "dark",
            setPreference,
            setTheme,
            toggleTheme,
        }),
        [preference, resolvedTheme, setPreference, setTheme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
