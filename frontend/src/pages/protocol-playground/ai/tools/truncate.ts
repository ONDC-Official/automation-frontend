export const TOOL_RESULT_MAX_CHARS = 12_000;

export function truncateText(value: string, max: number = TOOL_RESULT_MAX_CHARS): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max)}\n… [truncated, original ${value.length} chars]`;
}

export function stringifyResult(value: unknown, max: number = TOOL_RESULT_MAX_CHARS): string {
    let text: string;
    try {
        text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    } catch {
        text = String(value);
    }
    return truncateText(text, max);
}
