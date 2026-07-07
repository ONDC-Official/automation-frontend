import { useEffect, useRef } from "react";
import { useAppSelector } from "@store/hooks";
import { selectResolvedTheme } from "@store/slices/themeSlice";
import { applyThemeToDocument } from "@/theme/utils/themeUtils";

/** Applies `themeSlice` to the document root — mount once inside `PersistGate`. */
const ThemeWrapper = () => {
    const resolvedTheme = useAppSelector(selectResolvedTheme);
    const isInitialMount = useRef(true);

    useEffect(() => {
        applyThemeToDocument(resolvedTheme, { animate: !isInitialMount.current });
        isInitialMount.current = false;
    }, [resolvedTheme]);

    return null;
};

export default ThemeWrapper;
