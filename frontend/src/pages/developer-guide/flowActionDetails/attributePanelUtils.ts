// ─── Raw Table type ───────────────────────────────────────────────────────────

export interface RawTableRow {
    rowType: "leaf" | "group";
    name: string;
    group: string;
    scope: string;
    description: string;
    skipIf: string;
    errorCode: string;
    successCode: string;
}

export interface RawTableAction {
    action: string;
    codeName: string;
    numLeafTests: number;
    generated: string;
    rows: RawTableRow[];
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

const HTML_TAG_RE = /<[^>]+>/g;

export function stripHtml(html: string): string {
    if (typeof document === "undefined")
        return html.replace(HTML_TAG_RE, " ").replace(/\s+/g, " ").trim();
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent ?? div.innerText ?? "").replace(/\s+/g, " ").trim();
}

export function hasHtml(s: string): boolean {
    return /<[^>]+>/.test(s);
}

export function safeDescription(s: string): string {
    return hasHtml(s) ? stripHtml(s) : s;
}

// ─── JSON Path helpers ────────────────────────────────────────────────────────

/**
 * Splits text into alternating plain-text and JSON-path segments.
 * Tracks bracket depth so filter expressions like $.tags[?(@.x == 'y')]
 * are captured as a single token.
 */
export function splitByJsonPaths(text: string): Array<{ text: string; isPath: boolean }> {
    const result: Array<{ text: string; isPath: boolean }> = [];
    const n = text.length;
    let i = 0;
    let lastPlainStart = 0;
    while (i < n) {
        if (text[i] === "$" && i + 1 < n && (text[i + 1] === "." || text[i + 1] === "[")) {
            if (i > lastPlainStart) {
                result.push({ text: text.slice(lastPlainStart, i), isPath: false });
            }
            let j = i + 1;
            let depth = 0;
            while (j < n) {
                const c = text[j];
                if (c === "[") {
                    depth++;
                } else if (c === "]") {
                    depth--;
                    if (depth < 0) break;
                } else if (
                    depth === 0 &&
                    (c === " " ||
                        c === "\t" ||
                        c === "\n" ||
                        c === '"' ||
                        c === "'" ||
                        c === "," ||
                        c === ";" ||
                        c === ")")
                ) {
                    break;
                }
                j++;
            }
            result.push({ text: text.slice(i, j), isPath: true });
            i = j;
            lastPlainStart = j;
        } else {
            i++;
        }
    }
    if (lastPlainStart < n) {
        result.push({ text: text.slice(lastPlainStart), isPath: false });
    }
    return result;
}

export function extractJsonPaths(text: string): string[] {
    return splitByJsonPaths(text)
        .filter((p) => p.isPath)
        .map((p) => p.text);
}

/**
 * Normalise a JSONPath for prefix matching:
 *  - strips leading $. / $
 *  - ignores _EXTERNAL cross-payload references
 *  - strips filter expressions [?...] (cuts at that point)
 *  - replaces [*] wildcards and numeric indices with a dot separator
 *  - collapses double-dots
 */
export function normalizePathForMatch(path: string): string {
    if (path.includes("_EXTERNAL")) return "";
    path = path.replace(/^\$\.?/, "").trim();
    const filterIdx = path.indexOf("[?");
    if (filterIdx !== -1) path = path.slice(0, filterIdx);
    path = path.replace(/\[\*\]\./g, ".").replace(/\[\*\]$/, "");
    path = path.replace(/\[\d+\]\./g, ".").replace(/\[\d+\]$/, "");
    path = path.replace(/\.{2,}/g, ".").replace(/\.$/, "");
    return path.trim();
}

/**
 * True if extractedPath and selectedPath refer to the same or related field.
 *  - Exact match (after normalisation)
 *  - Rule path is a child of the selected path
 *  - Rule path was truncated by a [?...] filter — only then allow reverse prefix match
 */
export function pathMatches(extractedPath: string, selectedPath: string): boolean {
    const norm1 = normalizePathForMatch(extractedPath);
    const norm2 = normalizePathForMatch(selectedPath);
    if (!norm1 || !norm2) return false;
    if (norm1 === norm2) return true;
    if (norm1.startsWith(norm2 + ".")) return true;
    if (extractedPath.includes("[?") && norm2.startsWith(norm1 + ".")) return true;
    return false;
}

/** Extract leaf rows for a given API from the raw table data object. */
export function getLeafRowsForApi(
    rawTable: Record<string, RawTableAction>,
    api: string
): RawTableRow[] {
    return rawTable[api]?.rows.filter((r) => r.rowType === "leaf") ?? [];
}
