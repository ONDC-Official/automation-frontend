import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useTheme } from "@/context/theme/themeContext";
import { subscribeToThemeApply } from "@/context/theme/themeUtils";
import { EDITOR_CONFIG, getEditorThemeName } from "@/components/PayloadEditor/constants";
import { cn } from "@/lib/utils";
import type { ICodeEditorProps } from "@/components/PayloadEditor/types";

const DEFAULT_OPTIONS: MonacoEditor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    padding: EDITOR_CONFIG.padding,
    fontSize: EDITOR_CONFIG.fontSize,
    fontFamily: EDITOR_CONFIG.fontFamily,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: "on",
    formatOnPaste: true,
    formatOnType: true,
    scrollbar: {
        vertical: "visible",
        horizontal: "visible",
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
    },
};

export const CodeEditor = ({
    value,
    defaultValue,
    language = EDITOR_CONFIG.language,
    readOnly = false,
    onChange,
    onMount,
    beforeMount,
    editorKey,
    path,
    options,
    className,
}: ICodeEditorProps) => {
    const { resolvedTheme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [editorTheme, setEditorTheme] = useState(() => getEditorThemeName(resolvedTheme));

    const mergedOptions = useMemo(
        () => ({
            ...DEFAULT_OPTIONS,
            ...options,
            readOnly,
        }),
        [options, readOnly]
    );

    const applyMonacoTheme = useCallback((theme: "light" | "dark") => {
        const themeName = getEditorThemeName(theme);
        monacoRef.current?.editor.setTheme(themeName);
        setEditorTheme(themeName);
    }, []);

    useEffect(() => subscribeToThemeApply(applyMonacoTheme), [applyMonacoTheme]);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const relayout = () => editorRef.current?.layout();
        relayout();

        const observer = new ResizeObserver(relayout);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        editorRef.current?.updateOptions(mergedOptions);
        editorRef.current?.layout();
    }, [mergedOptions]);

    const handleEditorMount = useCallback(
        (editor: MonacoEditor.IStandaloneCodeEditor, monaco: Monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            monaco.editor.setTheme(editorTheme);
            editor.updateOptions(mergedOptions);
            requestAnimationFrame(() => editor.layout());
            onMount?.(editor, monaco);
        },
        [editorTheme, mergedOptions, onMount]
    );

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative h-full min-h-0 flex-1 overflow-hidden bg-n-0 dark:bg-surface-elevated",
                className
            )}
        >
            <Editor
                key={editorKey}
                path={path}
                theme={editorTheme}
                height="100%"
                width="100%"
                language={language}
                {...(value !== undefined ? { value } : { defaultValue: defaultValue ?? "" })}
                onChange={onChange}
                beforeMount={beforeMount}
                onMount={handleEditorMount}
                options={mergedOptions}
            />
        </div>
    );
};
