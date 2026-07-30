/**
 * Nav lifecycle status for Developer Guide version pills
 * (Released / Drafted / To Be Deprecated / Deprecated).
 *
 * Resolution order (first match wins):
 * 1. Backend-provided status (when Automation DB / builds API starts returning it)
 * 2. Frontend ENUM map below (curated until backend is ready)
 * 3. Default: "released"
 *
 * Fill `NAV_STATUS_ENUM` domain-by-domain using keys:
 *   - `domain|version`              → all use cases in that version
 *   - `domain|version|usecaseLabel` → specific use case override
 *
 * Example:
 *   "ONDC:FIS12|2.0.1": "deprecated",
 *   "ONDC:FIS12|2.3.0|UNIFIED CREDIT": "released",
 */

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

/**
 * Frontend source of truth until backend status ships.
 * Sources:
 * - FIS: https://ondc-official.github.io/ONDC-FIS-Specifications/ (Branches)
 * - TRV: https://ondc-official.github.io/mobility-specification/ (Branches)
 */
export const NAV_STATUS_ENUM: Record<string, NavStatus> = {
    // ── FIS10 ──────────────────────────────────────────────────────────────
    // Gift Card → release-FIS10-2.1.0
    "ONDC:FIS10|2.1.0": "released",

    // ── FIS12 ──────────────────────────────────────────────────────────────
    // Personal Loan | Gold Loan → release-FIS12-2.0.2
    "ONDC:FIS12|2.0.2": "released",
    // Personal Loan | Gold Loan | Credit Card → draft-FIS12-2.0.3
    "ONDC:FIS12|2.0.3": "drafted",
    // Purchase Finance → release-FIS12-2.2.1
    "ONDC:FIS12|2.2.1": "released",
    // LAMF | BL (Unified Credit) → draft-FIS12-2.3.0
    "ONDC:FIS12|2.3.0": "drafted",

    // ── FIS13 ──────────────────────────────────────────────────────────────
    // Sachet Insurance → release-FIS13-2.0.0-sachet
    "ONDC:FIS13|2.0.0": "released",
    // Health / Motor (+ Marine when present) → release-FIS13-health / motor / marine
    "ONDC:FIS13|2.0.1": "released",

    // ── FIS14 ──────────────────────────────────────────────────────────────
    // Mutual Funds → release-FIS14-2.1.0
    "ONDC:FIS14|2.1.0": "released",

    // ── TRV10 (Ride Hailing) ───────────────────────────────────────────────
    // release-TRV10-2.0.0 → DEPRECATED
    "ONDC:TRV10|2.0.0": "deprecated",
    // release-TRV10-2.0.1 → TO_BE_DEPRECATED
    "ONDC:TRV10|2.0.1": "to-be-deprecated",
    // release-TRV10-2.1.0 → RELEASED
    "ONDC:TRV10|2.1.0": "released",

    // ── TRV11 (Unreserved Ticketing) ──────────────────────────────────────
    // release-TRV11-2.0.0 → TO_BE_DEPRECATED
    "ONDC:TRV11|2.0.0": "to-be-deprecated",
    // release-TRV11-2.0.1 → RELEASED
    "ONDC:TRV11|2.0.1": "released",
    // draft-TRV11-2.1.0 → DRAFT
    "ONDC:TRV11|2.1.0": "drafted",

    // ── TRV12 (Reserved Ticketing: Airline / Intercity) ───────────────────
    // release-TRV12-airline / release-TRV12-intercity → RELEASED
    "ONDC:TRV12|2.0.0": "released",

    // ── TRV13 (Accommodation Booking) ─────────────────────────────────────
    // release-TRV13-hotel → TO_BE_DEPRECATED
    "ONDC:TRV13|2.0.0": "to-be-deprecated",
    // release-TRV13-2.0.1 → RELEASED
    "ONDC:TRV13|2.0.1": "released",

    // ── TRV14 (Unreserved Entry Pass) ─────────────────────────────────────
    // release-TRV14-2.0.0 → RELEASED
    "ONDC:TRV14|2.0.0": "released",
};

export function isNavStatus(value: unknown): value is NavStatus {
    return typeof value === "string" && (NAV_STATUS_VALUES as readonly string[]).includes(value);
}

export function navStatusKey(domainKey: string, versionKey: string, usecaseLabel?: string): string {
    return usecaseLabel
        ? `${domainKey}|${versionKey}|${usecaseLabel}`
        : `${domainKey}|${versionKey}`;
}

export interface ResolveNavStatusParams {
    domainKey: string;
    versionKey: string;
    usecaseLabel?: string;
    /** Raw status from builds API when present. */
    backendStatus?: string | null;
}

/**
 * Prefer backend status when valid; otherwise fall back to the frontend ENUM.
 */
export function resolveNavStatus({
    domainKey,
    versionKey,
    usecaseLabel,
    backendStatus,
}: ResolveNavStatusParams): NavStatus {
    if (isNavStatus(backendStatus)) {
        return backendStatus;
    }

    if (usecaseLabel) {
        const usecaseKey = navStatusKey(domainKey, versionKey, usecaseLabel);
        const usecaseStatus = NAV_STATUS_ENUM[usecaseKey];
        if (usecaseStatus) return usecaseStatus;
    }

    const versionStatus = NAV_STATUS_ENUM[navStatusKey(domainKey, versionKey)];
    if (versionStatus) return versionStatus;

    return "released";
}

/**
 * @deprecated Prefer {@link resolveNavStatus} with domain/version/usecase.
 * Kept for call sites that only have a nav-node id; uses ENUM keys that match
 * node ids only if you add them that way — structured keys are preferred.
 */
export function getNavStatus(nodeId: string, backendStatus?: string | null): NavStatus {
    if (isNavStatus(backendStatus)) {
        return backendStatus;
    }
    return NAV_STATUS_ENUM[nodeId] ?? "released";
}
