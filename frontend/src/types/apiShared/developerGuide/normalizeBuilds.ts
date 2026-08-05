import type { BuildEntry, BuildLifecycleStatus } from "./developerGuide.types";

const LIFECYCLE_STATUSES: readonly BuildLifecycleStatus[] = [
    "released",
    "drafted",
    "to-be-deprecated",
    "deprecated",
] as const;

/** Maps Automation DB / available-builds status strings onto frontend NavStatus values. */
const BACKEND_STATUS_ALIASES: Record<string, BuildLifecycleStatus> = {
    RELEASED: "released",
    DRAFT: "drafted",
    DRAFTED: "drafted",
    TO_BE_DEPRECATED: "to-be-deprecated",
    DEPRECATED: "deprecated",
};

/** Wire format for per-use-case status from GET available-builds. */
export interface RawUsecaseStatusEntry {
    usecase: string;
    status: string;
}

/** Wire format for GET available-builds before client-side normalization. */
export interface RawBuildEntry {
    key: string;
    version: Array<{
        key: string;
        usecase: string[];
        status?: string;
        /** Array from Automation DB, or already-normalized Record. */
        usecaseStatus?: RawUsecaseStatusEntry[] | Record<string, string>;
    }>;
}

/**
 * Normalize a backend lifecycle status string to the frontend union.
 * Accepts uppercase API values (`RELEASED`, `DRAFT`) and lowercase UI values.
 * Returns null when the value is missing or unrecognized.
 */
export function normalizeBuildLifecycleStatus(raw: unknown): BuildLifecycleStatus | null {
    if (typeof raw !== "string" || !raw.trim()) return null;

    const trimmed = raw.trim();
    const aliasKey = trimmed.toUpperCase().replace(/-/g, "_");
    const aliased = BACKEND_STATUS_ALIASES[aliasKey];
    if (aliased) return aliased;

    if ((LIFECYCLE_STATUSES as readonly string[]).includes(trimmed)) {
        return trimmed as BuildLifecycleStatus;
    }

    return null;
}

function normalizeUsecaseStatusMap(
    usecaseStatus: RawBuildEntry["version"][number]["usecaseStatus"]
): Record<string, BuildLifecycleStatus> | undefined {
    if (!usecaseStatus) return undefined;

    const out: Record<string, BuildLifecycleStatus> = {};

    if (Array.isArray(usecaseStatus)) {
        if (usecaseStatus.length === 0) return undefined;
        for (const entry of usecaseStatus) {
            if (!entry || typeof entry !== "object") continue;
            const label = typeof entry.usecase === "string" ? entry.usecase : null;
            const status = normalizeBuildLifecycleStatus(entry.status);
            if (label && status) out[label] = status;
        }
    } else if (typeof usecaseStatus === "object") {
        for (const [label, rawStatus] of Object.entries(usecaseStatus)) {
            const status = normalizeBuildLifecycleStatus(rawStatus);
            if (status) out[label] = status;
        }
    }

    return Object.keys(out).length > 0 ? out : undefined;
}

/** Convert available-builds wire payload into the BuildEntry shape used by the app. */
export function normalizeBuildEntries(raw: unknown): BuildEntry[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((entry): entry is RawBuildEntry => !!entry && typeof entry === "object")
        .map((entry) => ({
            key: typeof entry.key === "string" ? entry.key : "",
            version: (Array.isArray(entry.version) ? entry.version : []).map((ver) => {
                const status = normalizeBuildLifecycleStatus(ver?.status) ?? undefined;
                const usecaseStatus = normalizeUsecaseStatusMap(ver?.usecaseStatus);
                return {
                    key: typeof ver?.key === "string" ? ver.key : "",
                    usecase: Array.isArray(ver?.usecase)
                        ? ver.usecase.filter((u): u is string => typeof u === "string")
                        : [],
                    ...(status ? { status } : {}),
                    ...(usecaseStatus ? { usecaseStatus } : {}),
                };
            }),
        }))
        .filter((entry) => entry.key.length > 0);
}
