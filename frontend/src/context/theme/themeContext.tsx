import { useContext } from "react";
import { ThemeContextValue } from "@/context/theme/themeContextTypes";
import { ThemeContext } from "@/context/theme/themeContextProvider";

/**
 * Access theme preference and actions. Must be used within `ThemeContextProvider`.
 */
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeContextProvider");
    }
    return context;
};
