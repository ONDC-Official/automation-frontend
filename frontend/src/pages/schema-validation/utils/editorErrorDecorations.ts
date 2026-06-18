import type { editor as MonacoEditor } from "monaco-editor";
import type { IParsedValidationError } from "@pages/schema-validation/types";
import type { MonacoModule, IEditorRange } from "@pages/schema-validation/types";
import {
    escapeRegExp,
    getKeyRangeOnLine,
    getLineRangeAtIndex,
    getValueRangeOnLine,
} from "@/pages/schema-validation/utils/helpers";

let activeDecorationIds: string[] = [];

/** Shared red used for validation error highlights (5% opacity). */

/**
 * Converts API/JSONPath strings into key segments for source lookup.
 *
 * @param rawPath - Path such as `$.message.intent.type` or `/message/intent/type`
 * @returns Ordered key segments
 */
export function parsePathSegments(rawPath: string): string[] {
    if (!rawPath) {
        return [];
    }

    let normalized = rawPath.trim();

    if (normalized.startsWith("$.")) {
        normalized = normalized.slice(2);
    } else if (normalized.startsWith("$")) {
        normalized = normalized.slice(1);
    } else if (normalized.startsWith("/")) {
        normalized = normalized.slice(1);
    }

    normalized = normalized.replace(/\['([^']+)'\]/g, ".$1");
    normalized = normalized.replace(/\["([^"]+)"\]/g, ".$1");
    normalized = normalized.replace(/\[[^\]]+\]/g, "");

    if (normalized.includes("/")) {
        return normalized
            .split("/")
            .map((segment) => segment.trim())
            .filter(Boolean);
    }

    return normalized
        .split(".")
        .map((segment) => segment.trim())
        .filter(Boolean);
}

/**
 * Finds line and value ranges for a JSON path inside a JSON source string.
 *
 * @param source - JSON payload text from the editor
 * @param rawPath - JSON path associated with a validation error
 * @returns Line range and optional value range for inline highlighting
 */
export function findPathRangeInJsonSource(
    source: string,
    rawPath: string
): { lineRange: IEditorRange; valueRange: IEditorRange | null; keyRange: IEditorRange | null } | null {
    const segments = parsePathSegments(rawPath);
    if (segments.length === 0) {
        return null;
    }

    let searchFrom = 0;
    let lastMatchIndex = -1;
    let matchedCount = 0;
    let lastSegment = "";

    for (const segment of segments) {
        const pattern = new RegExp(`"${escapeRegExp(segment)}"\\s*:`);
        const slice = source.slice(searchFrom);
        const match = pattern.exec(slice);
        if (!match) {
            break;
        }

        lastMatchIndex = searchFrom + match.index;
        searchFrom = lastMatchIndex + match[0].length;
        matchedCount += 1;
        lastSegment = segment;
    }

    if (matchedCount === 0 || lastMatchIndex === -1) {
        return null;
    }

    const lineStart = source.lastIndexOf("\n", lastMatchIndex) + 1;
    const lineEndIndex = source.indexOf("\n", lastMatchIndex);
    const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
    const line = source.slice(lineStart, lineEnd);
    const lineRange = getLineRangeAtIndex(source, lastMatchIndex);
    const valueRange = getValueRangeOnLine(lineStart, line, lineRange.startLineNumber);
    const keyRange = getKeyRangeOnLine(lineStart, line, lineRange.startLineNumber, lastSegment);

    return { lineRange, valueRange, keyRange };
}

/**
 * Removes validation decorations and markers from the Monaco editor.
 *
 * @param editor - Active Monaco editor instance
 * @param monaco - Monaco module reference
 */
export function clearEditorErrorDecorations(
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: MonacoModule
): void {
    activeDecorationIds = editor.deltaDecorations(activeDecorationIds, []);
    const model = editor.getModel();
    if (model) {
        monaco.editor.setModelMarkers(model, "schema-validation", []);
    }
}

/**
 * Applies line highlights and squiggly markers for validation errors.
 *
 * @param editor - Active Monaco editor instance
 * @param monaco - Monaco module reference
 * @param source - Current JSON payload text
 * @param errors - Parsed validation errors
 */
export function applyEditorErrorDecorations(
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: MonacoModule,
    source: string,
    errors: IParsedValidationError[]
): void {
    clearEditorErrorDecorations(editor, monaco);

    const decorations: MonacoEditor.IModelDeltaDecoration[] = [];
    const markers: MonacoEditor.IMarkerData[] = [];
    const seenLineNumbers = new Set<number>();

    for (const error of errors) {
        if (!error.path) {
            continue;
        }

        const match = findPathRangeInJsonSource(source, error.path);
        if (!match) {
            continue;
        }

        const markerRange = match.keyRange ?? match.valueRange ?? match.lineRange;

        if (!seenLineNumbers.has(match.lineRange.startLineNumber)) {
            seenLineNumbers.add(match.lineRange.startLineNumber);
            decorations.push({
                range: match.lineRange,
                options: {
                    isWholeLine: true,
                    className: "schema-validation-error-line",
                    overviewRuler: {
                        color: "#de350b",
                        position: monaco.editor.OverviewRulerLane.Right,
                    },
                },
            });
        }

        const inlineRange = match.keyRange ?? match.valueRange;
        if (inlineRange) {
            decorations.push({
                range: inlineRange,
                options: {
                    inlineClassName: "schema-validation-error-inline",
                },
            });
        }

        markers.push({
            startLineNumber: markerRange.startLineNumber,
            startColumn: markerRange.startColumn,
            endLineNumber: markerRange.endLineNumber,
            endColumn: markerRange.endColumn,
            message: `${error.code}: ${error.message}`,
            severity: monaco.MarkerSeverity.Error,
        });
    }

    activeDecorationIds = editor.deltaDecorations(activeDecorationIds, decorations);
    const model = editor.getModel();
    if (model) {
        monaco.editor.setModelMarkers(model, "schema-validation", markers);
    }
}
