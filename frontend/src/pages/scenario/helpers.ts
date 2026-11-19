import { toast } from "sonner";
import { trackEvent } from "@utils/analytics";
import { ROUTES } from "@constants/routes";
import type { IDomain } from "@pages/schema-validation/types";
import type {
    IConfigCardItem,
    IConfigField,
    IConfigGroup,
    IConfigSource,
    IDomainVersionWithUsecase,
    INpPortalConfig,
    IScenarioFormData,
} from "@pages/scenario/types";

export function openSessionInNewTab(sessionId: string, subscriberUrl: string, role: string) {
    const params = new URLSearchParams({
        sessionId,
        subscriberUrl,
        role,
    });
    const newWindow = window.open(
        `${window.location.origin}${ROUTES.FLOW_TESTING}?${params}`,
        "_blank"
    );
    if (!newWindow) {
        toast.error(
            "Your browser blocked the popup. Please allow popups for this site and try again."
        );
    }
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

const SUBSCRIBER_URL_PATTERN = /^https?:\/\/.+/i;
/** Every session runs in PRE-PRODUCTION (the form's only option). */
const DEFAULT_ENV = "PRE-PRODUCTION";

/** Turns one NP Portal config into the same data the form produces. */
export function npPortalConfigToFormData(config: INpPortalConfig): IScenarioFormData {
    return {
        subscriberUrl: config.subscriber_url?.trim() ?? "",
        npType: config.np_type?.trim().toUpperCase() ?? "",
        domain: config.domain?.trim() ?? "",
        version: config.version?.trim() ?? "",
        usecaseId: config.usecase?.trim() ?? "",
        env: DEFAULT_ENV,
        orgId: config.org_id || undefined,
    };
}

/**
 * The fields the user still has to fill: empty ones, and ones Workbench does not
 * support. A bad domain also needs a new version and use case; a bad version
 * needs a new use case.
 */
export function findMissingFields(data: IScenarioFormData, domains: IDomain[]): IConfigField[] {
    const missing: IConfigField[] = [];
    if (!SUBSCRIBER_URL_PATTERN.test(data.subscriberUrl ?? "")) missing.push("subscriberUrl");
    if (data.npType !== "BAP" && data.npType !== "BPP") missing.push("npType");

    const domain = domains.find((d) => d.key === data.domain);
    const versions = (domain?.version as IDomainVersionWithUsecase[] | undefined) ?? [];
    const version = versions.find((v) => v.key === data.version);
    if (!domain) {
        missing.push("domain", "version", "usecaseId");
    } else if (!version) {
        missing.push("version", "usecaseId");
    } else if (!version.usecase?.includes(data.usecaseId)) {
        missing.push("usecaseId");
    }
    return missing;
}

const configCardId = (source: IConfigSource, data: IScenarioFormData) =>
    [
        source,
        data.orgId ?? "",
        data.subscriberUrl,
        data.npType,
        data.domain,
        data.version,
        data.usecaseId,
    ].join("|");

/**
 * One card per config: NP Portal configs first, then saved profile configs.
 * Only exact duplicates (same organisation and all 5 fields) are dropped.
 */
export function buildConfigCards(
    npPortalConfigs: INpPortalConfig[],
    savedPreferences: Record<string, IScenarioFormData>,
    domains: IDomain[]
): IConfigCardItem[] {
    const cards = new Map<string, IConfigCardItem>();
    npPortalConfigs.forEach((config) => {
        const data = npPortalConfigToFormData(config);
        const id = configCardId("np_portal", data);
        if (!cards.has(id)) {
            cards.set(id, {
                id,
                source: "np_portal",
                data,
                missingFields: findMissingFields(data, domains),
            });
        }
    });
    Object.entries(savedPreferences).forEach(([name, data]) => {
        const id = `saved|${name}`;
        cards.set(id, {
            id,
            source: "saved",
            name,
            data,
            missingFields: findMissingFields(data, domains),
        });
    });
    return [...cards.values()];
}

/** Groups cards under their subscriber URL, keeping the order they first appear in. */
export function groupConfigsBySubscriberUrl(items: IConfigCardItem[]): IConfigGroup[] {
    const groups = new Map<string, IConfigGroup>();
    items.forEach((item) => {
        const url = (item.data.subscriberUrl ?? "").replace(/\/+$/, "");
        const group = groups.get(url) ?? { subscriberUrl: url, items: [] };
        group.items.push(item);
        groups.set(url, group);
    });
    return [...groups.values()];
}
