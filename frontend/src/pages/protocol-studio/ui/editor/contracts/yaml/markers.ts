import type { editor } from "monaco-editor";

import type { ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";

export const CONTRACT_MARKER_OWNER = "studio-contract";

/** Monaco severities (`MarkerSeverity`), inlined so this module stays free of Monaco at runtime. */
const SEVERITY = { error: 8, warning: 4 } as const;

/** The file's YAML errors and warnings as Monaco markers. */
export const toMonacoMarkers = (parsed: ParsedContract): editor.IMarkerData[] =>
    [
        ...parsed.errors.map((issue) => ({ ...issue, severity: SEVERITY.error })),
        ...parsed.warnings.map((issue) => ({ ...issue, severity: SEVERITY.warning })),
    ].map(({ message, line, column, endLine, endColumn, severity }) => ({
        message,
        severity,
        startLineNumber: line,
        startColumn: column,
        endLineNumber: endLine,
        endColumn,
    }));
