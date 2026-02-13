import { useState, useMemo } from "react";
import { codeSnippets } from "@pages/auth-header/code-snippets/data";
import { LanguageKey, FunctionType } from "@pages/auth-header/code-snippets/types";

/**
 * Hook to drive the auth header code-snippet viewer.
 * - Tracks selected language and function type (generate vs verify).
 * - Exposes the available languages and the currently active snippet/code block.
 */

export const useCodeSnippet = () => {
    const [selectedLang, setSelectedLang] = useState<LanguageKey>("python");
    const [functionType, setFunctionType] = useState<FunctionType>("generate");

    const languages = useMemo(() => Object.keys(codeSnippets) as LanguageKey[], []);

    const currentSnippet = useMemo(() => codeSnippets[selectedLang], [selectedLang]);

    const currentCode = useMemo(
        () => (functionType === "generate" ? currentSnippet.generate : currentSnippet.verify),
        [functionType, currentSnippet]
    );

    return {
        selectedLang,
        setSelectedLang,
        functionType,
        setFunctionType,
        languages,
        currentSnippet,
        currentCode,
    };
};
