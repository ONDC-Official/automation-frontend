import type { IUser } from "@/types/user";
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
/**
 * Every NP Portal config the logged-in user's organisations came with (from SSO,
 * via /auth/api/me), tagged with its organisation. Values are passed on as sent;
 * buildConfigCards drops exact repeats and marks what Workbench doesn't support.
 */
export function npPortalConfigsFromUser(user?: IUser): INpPortalConfig[] {
    return (user?.organisations ?? []).flatMap((org) =>
        (org.configs ?? []).map((config) => ({
            subscriber_url: config?.subscriberUrl,
            np_type: config?.npType,
            domain: config?.domain,
            version: config?.version,
            usecase: config?.useCase,
            org_id: org.organisationId,
        }))
    );
}

/**
 * Only what belongs to the organisation the user is working for: its NP Portal
 * configs, and saved configs made for it (or saved without an organisation).
 * With no organisation (logged out, or a login without organisations) nothing is hidden.
 */
export function configsForOrganisation(
    npPortalConfigs: INpPortalConfig[],
    savedPreferences: Record<string, IScenarioFormData>,
    organisationId?: string
): { npPortalConfigs: INpPortalConfig[]; savedPreferences: Record<string, IScenarioFormData> } {
    if (!organisationId) return { npPortalConfigs, savedPreferences };
    return {
        npPortalConfigs: npPortalConfigs.filter((c) => c.org_id === organisationId),
        savedPreferences: Object.fromEntries(
            Object.entries(savedPreferences).filter(
                ([, pref]) => !pref.orgId || pref.orgId === organisationId
            )
        ),
    };
}

/** A version for display: "v1.2.5". NP Portal already writes "v 1.2", so don't add a second v. */
export function versionLabel(version?: string): string {
    const v = version?.trim() ?? "";
    if (!v) return "";
    return /^v/i.test(v) ? v : `v${v}`;
}

export function npPortalConfigToFormData(config: INpPortalConfig): IScenarioFormData {
    // NP Portal's version and use case are not used: they never match Workbench's own
    // values, so the user always picks them (from Workbench's list) before launching.
    return {
        subscriberUrl: config.subscriber_url?.trim() ?? "",
        npType: config.np_type?.trim().toUpperCase() ?? "",
        domain: config.domain?.trim() ?? "",
        version: "",
        usecaseId: "",
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
