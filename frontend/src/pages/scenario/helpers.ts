import { trackEvent } from "@utils/analytics";

export function openSessionInNewTab(sessionId: string, subscriberUrl: string, role: string) {
    const currentUrl = window.location.origin;
    const newTabUrl = `${currentUrl}/flow-testing?sessionId=${sessionId}&subscriberUrl=${encodeURIComponent(subscriberUrl)}&role=${role}`;
    window.open(newTabUrl, "_blank");
}

export function truncateId(id: string, len = 28): string {
    if (!id) return "—";
    if (id.length <= len) return id;
    return `${id.slice(0, len / 2)}…${id.slice(-len / 2)}`;
}

export function trackSchemaValidationForm(action: string, label: string) {
    trackEvent({
        category: "SCHEMA_VALIDATION-FORM",
        action,
        label,
    });
}

export const NATIVE_SELECT_CLASS =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring focus-visible:ring-ring/50";
