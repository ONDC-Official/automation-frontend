/**
 * Nav lifecycle status for Developer Guide version pills
 * (Released / Drafted / To Be Deprecated / Deprecated).
 *
 * Source of truth: `GET available-builds` (`usecaseStatus` / `status`).
 * When the API omits status for a use case, callers must show no status styling.
 */

import { normalizeBuildLifecycleStatus } from "@/types/apiShared/developerGuide";

export type NavStatus = "released" | "drafted" | "to-be-deprecated" | "deprecated";

export const NAV_STATUS_VALUES: readonly NavStatus[] = [
    "released",
    "drafted",
    "to-be-deprecated",
    "deprecated",
] as const;

export const NAV_STATUS_LABEL: Record<NavStatus, string> = {
    released: "Released",
    drafted: "Drafted",
    "to-be-deprecated": "To Be Deprecated",
    deprecated: "Deprecated",
};

export const NAV_STATUS_STYLES: Record<NavStatus, string> = {
    released: "bg-[#DDEBDD] text-[#3F7F3F]",
    drafted: "bg-[#D8E8F6] text-[#1976D2]",
    "to-be-deprecated": "bg-[#FCE8D7] text-[#E6862E]",
    deprecated: "bg-[#FCE7EA] text-[#DC2626]",
};

export function isNavStatus(value: unknown): value is NavStatus {
    return typeof value === "string" && (NAV_STATUS_VALUES as readonly string[]).includes(value);
}

/** Backend status only — returns null when the API has no status for this entry. */
export function resolveNavStatus(backendStatus?: string | null): NavStatus | null {
    return normalizeBuildLifecycleStatus(backendStatus);
}
