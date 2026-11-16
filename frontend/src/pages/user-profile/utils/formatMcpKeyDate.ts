/**
 * Formats an API timestamp for the MCP key UI, e.g. "8 Oct 2026".
 * Returns an em dash for a missing or unparseable value rather than
 * "Invalid Date".
 */
export const formatMcpKeyDate = (iso?: string | null): string => {
    if (!iso) {
        return "—";
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "—";
    }
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};
