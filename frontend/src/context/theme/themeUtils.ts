import {
    ThemePreference,
    ResolvedTheme,
    IApplyThemeOptions,
    ThemeApplyListener,
} from "@/context/theme/themeContextTypes";

const themeApplyListeners = new Set<ThemeApplyListener>();

/**
 * Subscribe to synchronous theme DOM application (inside view-transition `apply()`).
 * Use for canvas/imperative UIs (e.g. Monaco) that must update in the same frame as `.dark`.
 */
export const subscribeToThemeApply = (listener: ThemeApplyListener): (() => void) => {
    themeApplyListeners.add(listener);
    return () => {
        themeApplyListeners.delete(listener);
    };
};

const notifyThemeApplied = (theme: ResolvedTheme): void => {
    themeApplyListeners.forEach((listener) => listener(theme));
};

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
 * Returns true when the document root already reflects the given theme.
 */
export const isThemeApplied = (theme: ResolvedTheme): boolean => {
    const root = document.documentElement;
    return (
        root.dataset.theme === theme &&
        root.classList.contains("dark") === (theme === "dark") &&
        root.style.colorScheme === theme
    );
};

/**
 * Applies the resolved theme to the document root for CSS tokens and Tailwind `dark:`.
 *
 * @param theme - Resolved theme to apply
 * @param options - Optional settings; `animate` defaults to true
 */
export const applyThemeToDocument = (
    theme: ResolvedTheme,
    options: IApplyThemeOptions = {}
): void => {
    if (isThemeApplied(theme)) {
        return;
    }

    const { animate = true } = options;

    const apply = () => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        notifyThemeApplied(theme);
    };

    if (!animate || !("startViewTransition" in document)) {
        apply();
        return;
    }

    document.startViewTransition(() => apply());
};
