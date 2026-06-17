/** User-selected theme preference. */
export type ThemePreference = "light" | "dark";

/** Resolved theme applied to the document. */
export type ResolvedTheme = "light" | "dark";

export type ThemeApplyListener = (theme: ResolvedTheme) => void;

export interface ThemeContextValue {
    /** User preference (light or dark). */
    preference: ThemePreference;
    /** Active theme after resolving user preference. */
    resolvedTheme: ResolvedTheme;
    isDark: boolean;
    setPreference: (preference: ThemePreference) => void;
    setTheme: (theme: ResolvedTheme) => void;
    toggleTheme: () => void;
}

export interface IApplyThemeOptions {
    animate?: boolean;
}
