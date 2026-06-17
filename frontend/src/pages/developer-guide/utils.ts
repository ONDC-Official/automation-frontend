import { MockRunner } from "@ondc/automation-mock-runner";
import type { FlowStep, BuildEntry, DocMeta } from "./types";

/**
 * Decode a base64-encoded string (e.g. mock.generate / mock.validate /
 * mock.requirements / flow helperLib) into plain text.
 * Returns null for empty/missing values; returns the raw value on decode error.
 */
export function decodeBase64(value: string | undefined): string | null {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
        return MockRunner.decodeBase64(trimmed);
    } catch {
        return trimmed;
    }
}

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
    slug: string
): string | null {
    const domain = builds.find((d) => d.key === domainKey);
    if (!domain?.version) return null;
    // Normalize slug for comparison: spaces, hyphens, and underscores are equivalent
    const normalizeSlug = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "-");
    const normalizedSlug = normalizeSlug(slug);
    for (const ver of domain.version) {
        if (ver.key !== versionKey) continue;
        const found = ver.usecase?.find(
            (uc) => normalizeSlug(labelToSlug(uc)) === normalizedSlug || uc === slug
        );
        if (found) return found;
    }
    return null;
}

/** A domain is enabled if it has at least one version with use cases. */
export function isDomainEnabled(domain: BuildEntry): boolean {
    return domain.version.some((v) => v.usecase.length > 0);
}

const PRIORITY_DOC_ORDER = ["about ondc", "registry gateway", "network observability", "faqs"];

function normalizeDocKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getPriorityDocIndex(doc: DocMeta): number {
    const labelKey = normalizeDocKey(doc.label);
    const slugKey = normalizeDocKey(doc.slug);
    return PRIORITY_DOC_ORDER.findIndex(
        (key) =>
            labelKey === key || labelKey.includes(key) || slugKey === key || slugKey.includes(key)
    );
}

export function sortDocsByPreferredSequence(docs: DocMeta[]): DocMeta[] {
    return [...docs].sort((a, b) => {
        const aPriority = getPriorityDocIndex(a);
        const bPriority = getPriorityDocIndex(b);

        if (aPriority !== -1 || bPriority !== -1) {
            if (aPriority === -1) return 1;
            if (bPriority === -1) return -1;
            return aPriority - bPriority;
        }

        return a.label.localeCompare(b.label);
    });
}
