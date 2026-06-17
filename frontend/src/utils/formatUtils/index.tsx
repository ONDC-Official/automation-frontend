export const toTitleCase = (value: string): string =>
    value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

export function truncateId(id: string, len = 28): string {
    if (!id) return "—";
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}
