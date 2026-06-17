import { trackEvent } from "@utils/analytics";
import { ROUTES } from "@constants/routes";

export function openSessionInNewTab(sessionId: string, subscriberUrl: string, role: string) {
    const params = new URLSearchParams({
        sessionId,
        subscriberUrl,
        role,
    });
    window.open(`${window.location.origin}${ROUTES.FLOW_TESTING}?${params}`, "_blank");
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
