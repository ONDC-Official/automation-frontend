import { FC, useCallback } from "react";
import LanguageSelector from "@pages/auth-header/code-snippets/LanguageSelector";
import FunctionToggle from "@pages/auth-header/code-snippets/FunctionToggle";
import CodeEditor from "@pages/auth-header/code-snippets/CodeEditor";
import LibraryInfo from "@pages/auth-header/code-snippets/LibraryInfo";
import { useCodeSnippet } from "@pages/auth-header/code-snippets/hooks";
import { useClipboard } from "@hooks/useClipboard";

const CodeSnippets: FC = () => {
    const {
        selectedLang,
        setSelectedLang,
        functionType,
        setFunctionType,
        languages,
        currentSnippet,
        currentCode,
    } = useCodeSnippet();

    const { copied, copyToClipboard } = useClipboard();

    const handleCopy = useCallback(() => {
        copyToClipboard(currentCode);
    }, [currentCode, copyToClipboard]);

    return (
        <div className="space-y-4">
            <LanguageSelector
                languages={languages}
                selectedLang={selectedLang}
                onLanguageChange={setSelectedLang}
            />

            <FunctionToggle functionType={functionType} onFunctionTypeChange={setFunctionType} />

            <CodeEditor
                code={currentCode}
                language={currentSnippet.language}
                selectedLang={selectedLang}
                functionType={functionType}
                copied={copied}
                onCopy={handleCopy}
            />

            <LibraryInfo />
        </div>
    );
};

export default CodeSnippets;
