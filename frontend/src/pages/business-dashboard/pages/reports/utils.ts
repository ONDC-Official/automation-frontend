/**
 * `GET /report/:testId` returns `data` as a base64 GridFS blob. Depending on how
 * the report was posted it may arrive bare or as a `data:text/html;base64,…`
 * URI, so both shapes are accepted here.
 */
export function decodeReportHtml(data: string) {
    const base64 =
        data.includes(",") && data.startsWith("data:") ? data.slice(data.indexOf(",") + 1) : data;

    try {
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder("utf-8").decode(bytes);
    } catch {
        // Not base64 after all — some writers store the HTML verbatim.
        return data;
    }
}
