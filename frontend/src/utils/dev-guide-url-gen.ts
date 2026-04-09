/**
 * Utility for generating Developer Guide URLs.
 * Uses VITE_BASE_URL as the app origin so links work across environments.
 */

export interface DevGuideUrlOptions {
    domain: string;
    version: string;
    /** The use-case slug, e.g. "personal_loan" or "seller" */
    useCase: string;
    /** Optional: pre-select a specific flow in the sidebar */
    flowId?: string;
    /** Optional: pre-select a specific action step */
    actionId?: string;
    /** Optional: top-level tab to open, defaults to "flows" */
    view?: "flows" | "error-codes" | "supported-actions" | "docs" | "changelog";
}

/**
 * Build a full Developer Guide URL for the given context.
 * Opens to the flows view with the specified flow + action pre-selected.
 *
 * @example
 * buildDevGuideUrl({ domain: "ONDC:RET11", version: "1.2.5", useCase: "seller", flowId: "flow1", actionId: "search" })
 * // => "https://app.example.com/developer-guide/ONDC%3ARET11/1.2.5/seller?flow=flow1&action=search"
 */
export function buildDevGuideUrl({
    domain,
    version,
    useCase,
    flowId,
    actionId,
    view,
}: DevGuideUrlOptions): string {
    const base =
        (import.meta.env.VITE_FRONTENT_URL as string | undefined)?.replace(/\/$/, "") ??
        window.location.origin;
    const enc = encodeURIComponent;

    const path = `/developer-guide/${enc(domain)}/${enc(version)}/${enc(useCase)}`;

    const params = new URLSearchParams();
    if (view && view !== "flows") params.set("view", view);
    if (flowId) params.set("flow", flowId);
    if (actionId) params.set("action", actionId);

    const query = params.toString();
    return `${base}${path}${query ? `?${query}` : ""}`;
}

/** Open the Developer Guide in a new tab. Convenience wrapper around buildDevGuideUrl. */
export function openDevGuide(options: DevGuideUrlOptions): void {
    window.open(buildDevGuideUrl(options), "_blank", "noopener,noreferrer");
}
