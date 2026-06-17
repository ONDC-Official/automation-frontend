import { EDITOR_CONFIG } from "@/components/PayloadEditor/constants";
import type { editor as MonacoEditor } from "monaco-editor";

export const PLAYGROUND_EDITOR_OPTIONS: MonacoEditor.IStandaloneEditorConstructionOptions = {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: EDITOR_CONFIG.fontFamily,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: true,
};
