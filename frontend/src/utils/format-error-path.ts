/** Formats a JSON path for compact display in the error panel. */
export function formatErrorPath(path: string): string {
    return path
        .replace(/^\$\.?/, "")
        .replace(/^\//, "")
        .replace(/\$/g, "");
}
