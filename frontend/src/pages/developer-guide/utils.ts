import type { FlowStep, BuildEntry } from "./types";

export function getActionId(step: FlowStep): string {
    return step.action_id ?? step.api;
}

/** Convert use case label to URL slug (e.g. "Personal Loan" -> "personal-loan", "gift-card" -> "gift-card"). */
export function labelToSlug(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** Resolve use case slug to display label from builds response. */
export function getUsecaseLabelFromBuilds(
    builds: BuildEntry[],
    domainKey: string,
    versionKey: string,
    slug: string,
): string | null {
    const domain = builds.find((d) => d.key === domainKey);
    if (!domain?.version) return null;
    // Normalize slug for comparison: treat hyphens and underscores as equivalent
    const normalizeSlug = (s: string) => s.toLowerCase().replace(/[-_]+/g, "-");
    const normalizedSlug = normalizeSlug(slug);
    for (const ver of domain.version) {
        if (ver.key !== versionKey) continue;
        const found = ver.usecase?.find(
            (uc) => normalizeSlug(labelToSlug(uc)) === normalizedSlug || uc === slug,
        );
        if (found) return found;
    }
    return null;
}

/** A domain is enabled if it has at least one version with use cases. */
export function isDomainEnabled(domain: BuildEntry): boolean {
    return domain.version.some((v) => v.usecase.length > 0);
}
