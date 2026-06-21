/**
 * Local, presentation-only status mapping for sidebar version pills
 * (Released / Drafted / To Be Deprecated / Deprecated).
 *
 * No backend status field exists today — these values are not derived from
 * `BuildEntry`/`NavNode` or any API response. This module is the single seam
 * to swap in a real backend-provided status later: replace the body of
 * `getNavStatus` with a real lookup and nothing else needs to change.
 */

export type NavStatus = "released" | "drafted" | "to-be-deprecated" | "deprecated";

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

/**
 * Curated, stable placeholder map keyed by nav-node id (as built in
 * `buildNavTree.ts`, e.g. `usecase-ONDC:FIS12-2.3.0-Gold Loan`). Items not
 * present here default to "released" so newly-added use cases don't appear
 * deprecated by omission.
 *
 * Edit this map directly to change what's shown — there is no dynamic
 * derivation, by design, since there's nothing real to derive it from yet.
 */
const NAV_STATUS_OVERRIDES: Record<string, NavStatus> = {};

export function getNavStatus(nodeId: string): NavStatus {
    return NAV_STATUS_OVERRIDES[nodeId] ?? "released";
}
