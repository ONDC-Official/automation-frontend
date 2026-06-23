import { FC, useCallback, useEffect, useRef, useState } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { codeSnippets } from "@pages/auth-header/code-snippets/data";
import { CodeEditorProps } from "@pages/auth-header/code-snippets/types";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/context/theme/themeContext";
import { subscribeToThemeApply } from "@/context/theme/themeUtils";
import { getEditorThemeName } from "@/components/PayloadEditor/constants";

const EDITOR_HEIGHT = "500px";
const EDITOR_OPTIONS: MonacoEditor.IStandaloneEditorConstructionOptions = {
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    wordWrap: "on",
    padding: { top: 16 },
};

const CodeEditor: FC<CodeEditorProps> = ({
    code,
    language,
    selectedLang,
    functionType,
    onCopy,
}) => {
    const { resolvedTheme } = useTheme();
    const monacoRef = useRef<Monaco | null>(null);
    const [editorTheme, setEditorTheme] = useState(() => getEditorThemeName(resolvedTheme));

    const applyMonacoTheme = useCallback((theme: "light" | "dark") => {
        const themeName = getEditorThemeName(theme);
        monacoRef.current?.editor.setTheme(themeName);
        setEditorTheme(themeName);
    }, []);

    useEffect(() => subscribeToThemeApply(applyMonacoTheme), [applyMonacoTheme]);

    const handleEditorMount = useCallback(
        (_editor: MonacoEditor.IStandaloneCodeEditor, monaco: Monaco) => {
            monacoRef.current = monaco;
            monaco.editor.setTheme(editorTheme);
        },
        [editorTheme]
    );

    const functionLabel = functionType === "generate" ? "Generate" : "Verify";
    const editorTitle = `${codeSnippets[selectedLang].label} - ${functionLabel} Header`;

    return (
        <div className="relative overflow-hidden rounded-lg">
            <div className="flex items-center justify-between bg-brand-light px-4 py-1.5 dark:bg-muted">
                <span className="font-mono text-body-2 font-semibold tracking-wider text-foreground">
                    {editorTitle}
                </span>
                <button
                    type="button"
                    onClick={onCopy}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-body-2 font-semibold text-foreground transition-colors hover:bg-slate-700 hover:text-white"
                    aria-label="Copy code to clipboard"
                >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copy Code
                </button>
            </div>
            <Editor
                height={EDITOR_HEIGHT}
                language={language}
                value={code}
                theme={editorTheme}
                onMount={handleEditorMount}
                options={EDITOR_OPTIONS}
            />
        </div>
    );
};

export default CodeEditor;
