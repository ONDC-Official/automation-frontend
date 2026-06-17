import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    createContext,
    type ReactNode,
} from "react";
import {
    ThemePreference,
    ResolvedTheme,
    ThemeContextValue,
} from "@/context/theme/themeContextTypes";
import { applyThemeToDocument, resolveTheme } from "@/context/theme/themeUtils";

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
/**
 * Provides app-wide theme state backed by CSS tokens (`tokens.css`) and the `.dark` class.
 * Ant Design is not coupled here — ready for a future shadcn migration.
 */
export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
    const [preference, setPreferenceState] = useState<ThemePreference>(() => {
        return "light";
    });

    const resolvedTheme = useMemo(() => resolveTheme(preference), [preference]);
    const isInitialMount = useRef(true);

    useEffect(() => {
        applyThemeToDocument(resolvedTheme, { animate: !isInitialMount.current });
        isInitialMount.current = false;
    }, [resolvedTheme]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
    }, []);

    const setTheme = useCallback((theme: ResolvedTheme) => {
        setPreferenceState(theme);
    }, []);

    const toggleTheme = useCallback(() => {
        setPreferenceState((current) => {
            const currentResolved = resolveTheme(current);
            return currentResolved === "dark" ? "light" : "dark";
        });
    }, []);

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
