import { ThemePreference, ResolvedTheme } from "@/context/theme/themeContextType";

/**
 * Resolves the effective theme from preference and system settings.
 *
 * @param preference - User theme preference
 * @returns Resolved light or dark theme
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
    if (preference === "dark") {
        return "dark";
    } else {
        return "light";
    }
}

/**
 * Applies the resolved theme to the document root for CSS tokens and Tailwind `dark:`.
 *
 * @param theme - Resolved theme to apply
 */
export function applyThemeToDocument(theme: ResolvedTheme): void {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
}
