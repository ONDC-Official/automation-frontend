import { useEffect, useState } from "react";
import { useTheme } from "@/theme/hooks/useTheme";
import { subscribeToThemeApply } from "@/theme/utils/themeUtils";
import type { ResolvedTheme } from "@/theme/types";

/**
 * Returns the theme currently applied to the document, synced with view-transition
 * DOM updates. Use instead of `resolvedTheme` for imperative or inline-styled UIs
 * (e.g. Monaco, JsonView) that must not flip before Tailwind `dark:` transitions.
 */
export const useAppliedTheme = (): ResolvedTheme => {
    const { resolvedTheme } = useTheme();
    const [appliedTheme, setAppliedTheme] = useState<ResolvedTheme>(resolvedTheme);

    useEffect(() => subscribeToThemeApply(setAppliedTheme), []);

    return appliedTheme;
};
