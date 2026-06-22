/** Generates a client-side-only id for locally-created items (no backend persistence). */
export function generateLocalId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
