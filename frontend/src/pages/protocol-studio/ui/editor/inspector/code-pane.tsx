import { useEffect, useRef, useState } from "react";
import Editor, { type BeforeMount, type Monaco, type OnMount } from "@monaco-editor/react";
import { compileUserCodeV2, type CompiledUserCodeV2 } from "@ondc/automation-mock-runner";
import type { editor } from "monaco-editor";

import { useAppliedTheme } from "@/theme/hooks/useAppliedTheme";
import { EDITOR_CONFIG } from "@components/PayloadEditor/constants";
import {
    getStudioMonacoThemeName,
    STUDIO_MONACO_THEMES,
} from "@pages/protocol-studio/ui/editor/inspector/constants";
import {
    configureStudioTypeScript,
    createMonacoTranspiler,
    registerTypesViewLanguage,
    SANDBOX_MARKER_OWNER,
    setSandboxMarkers,
} from "@pages/protocol-studio/ui/editor/inspector/typescript-setup";
import type {
    IInspectorCodePaneProps,
    RevealRequest,
} from "@pages/protocol-studio/ui/editor/types";

const OPTIONS: editor.IStandaloneEditorConstructionOptions = {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: EDITOR_CONFIG.fontFamily,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    // A side panel is narrow: wrap instead of scrolling sideways.
    wordWrap: "on",
    padding: { top: 12, bottom: 12 },
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: true,
    tabSize: 2,
    renderLineHighlight: "all",
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    bracketPairColorization: { enabled: true },
    overviewRulerLanes: 0,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    scrollbar: { useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
};

const READ_ONLY_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
    ...OPTIONS,
    readOnly: true,
    domReadOnly: true,
};

const beforeMount: BeforeMount = (monaco) => {
    STUDIO_MONACO_THEMES.forEach(([name, data]) => monaco.editor.defineTheme(name, data));
    configureStudioTypeScript(monaco);
    registerTypesViewLanguage(monaco);
};

/** How long typing pauses before TypeScript step code is recompiled. */
const COMPILE_DELAY_MS = 700;

/** The last compile's outcome; it stays up while you type, until the next one lands. */
type CompileStatus =
    | { state: "done"; result: CompiledUserCodeV2 }
    | { state: "failed"; message: string };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One line under a TypeScript file: whether it compiles to runnable JavaScript. */
const CompileFooter = ({ status }: { status: CompileStatus | null }) => {
    if (!status) return null;
    let text: string;
    let tone: "ok" | "warn" | "error";
    if (status.state === "failed") {
        text = status.message;
        tone = "error";
    } else if (!status.result.ok) {
        text = `${plural(status.result.errors.length, "error")}: won't run until fixed`;
        tone = "error";
    } else {
        const warnings = status.result.warnings.length;
        text = `Compiles to JavaScript${warnings ? ` · ${plural(warnings, "warning")}` : ""}`;
        tone = warnings ? "warn" : "ok";
    }
    return (
        <p
            className="studio-compile"
            data-tone={tone}
            role="status"
            title={
                status.state === "done"
                    ? `${status.result.compiler} · type errors are shown but don't block running`
                    : undefined
            }
        >
            <span className="studio-compile-dot" aria-hidden="true" />
            {text}
        </p>
    );
};

const revealRange = (ed: editor.IStandaloneCodeEditor, reveal: RevealRequest) => {
    const range = {
        startLineNumber: reveal.line,
        startColumn: reveal.column,
        endLineNumber: reveal.line,
        endColumn: reveal.column + reveal.length,
    };
    ed.revealRangeInCenter(range);
    ed.setSelection(range);
    ed.focus();
};

/**
 * Studio-local Monaco wrapper. The shared `CodeEditor` uses opaque `vs` / `vs-dark`;
 * these themes follow the app theme the same way but keep a transparent surface,
 * so the recessed well shows through. One model per `path`, so each tab keeps
 * its own undo history.
 */
export const InspectorCodePane = ({
    path,
    language,
    value,
    onChange,
    readOnly = false,
    reveal,
    compileAs,
    helperNames,
}: IInspectorCodePaneProps) => {
    const theme = useAppliedTheme();
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [monaco, setMonaco] = useState<Monaco | null>(null);
    const [status, setStatus] = useState<CompileStatus | null>(null);
    const compiles = language === "typescript" && compileAs !== undefined;
    // What the last compile was of: an unchanged file isn't compiled again.
    const compiledRef = useRef<string | null>(null);

    // TypeScript step code compiles to the JavaScript the runner executes once
    // typing pauses; sandbox errors and warnings are marked on their lines. The
    // previous result stays up meanwhile, so the footer doesn't flicker as you type.
    useEffect(() => {
        if (!compiles || !monaco || !compileAs) {
            setStatus(null);
            compiledRef.current = null;
            return;
        }
        const key = `${path}\n${compileAs}\n${(helperNames ?? []).join(",")}\n${value}`;
        if (key === compiledRef.current) return;
        let stale = false;
        const timer = window.setTimeout(async () => {
            const model = monaco.editor.getModel(monaco.Uri.parse(path));
            const transpiler = model ? createMonacoTranspiler(monaco, model) : null;
            if (!model || !transpiler) {
                setStatus({
                    state: "failed",
                    message: "TypeScript isn't available in this editor",
                });
                return;
            }
            try {
                const result = await compileUserCodeV2(model.getValue(), compileAs, {
                    transpiler,
                    helperNames,
                    fileName: path,
                });
                if (stale || model.isDisposed()) return;
                compiledRef.current = key;
                setSandboxMarkers(monaco, model, result.errors, result.warnings);
                setStatus({ state: "done", result });
            } catch (e) {
                if (!stale) {
                    setStatus({
                        state: "failed",
                        message: `Couldn't compile: ${e instanceof Error ? e.message : String(e)}`,
                    });
                }
            }
        }, COMPILE_DELAY_MS);
        return () => {
            stale = true;
            window.clearTimeout(timer);
        };
    }, [compiles, monaco, compileAs, path, value, helperNames]);

    // A file that no longer compiles here keeps no stale sandbox markers.
    useEffect(() => {
        if (compiles || !monaco) return;
        const model = monaco.editor.getModel(monaco.Uri.parse(path));
        if (model) monaco.editor.setModelMarkers(model, SANDBOX_MARKER_OWNER, []);
    }, [compiles, monaco, path]);
    // A reveal that arrives before Monaco has loaded waits for onMount.
    const pendingRef = useRef<RevealRequest | null>(null);

    // Runs after the editor has switched to `path` (child effects run first).
    useEffect(() => {
        if (!reveal) return;
        if (editorRef.current) revealRange(editorRef.current, reveal);
        else pendingRef.current = reveal;
    }, [reveal]);

    const onMount: OnMount = (ed, instance) => {
        editorRef.current = ed;
        setMonaco(instance);
        if (pendingRef.current) {
            revealRange(ed, pendingRef.current);
            pendingRef.current = null;
        }
    };

    return (
        // `nokey`: React Flow's document-wide key handling (Space pans the canvas)
        // must skip the editor. Monaco types through EditContext, not a textarea,
        // so React Flow doesn't recognise it as an input and swallows every space.
        <div className="nokey flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
                <Editor
                    path={path}
                    language={language}
                    value={value}
                    theme={getStudioMonacoThemeName(theme)}
                    beforeMount={beforeMount}
                    onMount={onMount}
                    onChange={(next) => onChange?.(next ?? "")}
                    options={readOnly ? READ_ONLY_OPTIONS : OPTIONS}
                    loading={<div className="studio-loading">Loading editor…</div>}
                />
            </div>
            {compiles ? <CompileFooter status={status} /> : null}
        </div>
    );
};

export default InspectorCodePane;
