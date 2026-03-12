import type { FlowStep } from "./types";
import type { DomainItem, DomainResponse } from "@pages/home/types";

export function getActionId(step: FlowStep): string {
    return step.action_id ?? step.api;
}

/** Convert use case label to URL slug (e.g. "Personal Loan" -> "personal_loan"). */
export function labelToSlug(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/** Resolve use case slug to display label from domain response. */
export function getUsecaseLabelFromSlug(
    domainResponse: DomainResponse,
    domainKey: string,
    versionKey: string,
    slug: string
): string | null {
    const domain = domainResponse.domain.find((d) => d.key === domainKey);
    if (!domain?.version) return null;
    for (const ver of domain.version) {
        if (ver.key !== versionKey) continue;
        const found = ver.usecase?.find((uc) => labelToSlug(uc) === slug);
        if (found) return found;
    }
    return null;
}

/** Check if domain has any use cases (for enabled domains). */
export function isDomainEnabled(domain: DomainItem): boolean {
    return domain.key.toUpperCase() === "ONDC:FIS12";
}
