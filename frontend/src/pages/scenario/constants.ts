import type { IDomain } from "@pages/schema-validation/types";
import { INewSessionFormValues } from "@pages/scenario/types";

export const DEFAULT_VALUES: INewSessionFormValues = {
    subscriberUrl: "",
    domain: "",
    version: "",
    usecaseId: "",
    npType: "BAP",
    env: "PRE-PRODUCTION",
    orgId: "",
    config: "",
};

/** Friendly labels for the Scenario Testing "Select Domain" field, keyed by the raw domain key the API returns. */
export const SCENARIO_DOMAIN_LABELS: Record<string, string> = {
    "nic2004:60232": "Logistics (nic2004:60232)",
    "ONDC:LOG10": "Logistics P2P (LOG10)",
    "ONDC:LOG11": "Logistics P2H2P (LOG11)",
    "ONDC:TRV10": "Ride hailing (TRV10)",
    "ONDC:TRV11": "Unreserved travel ticketing (TRV11)",
    "ONDC:TRV12": "Reserved travel ticketing (TRV12)",
    "ONDC:TRV13": "Accommodation Hotel booking (TRV13)",
    "ONDC:TRV14": "Unreserved entry pass / Experiences (TRV14)",
    "ONDC:RET10": "Grocery (RET10)",
    "ONDC:RET11": "F&B (RET11)",
    "ONDC:RET12": "Fashion (RET12)",
    "ONDC:RET13": "BPC (RET13)",
    "ONDC:RET14": "Electronics (RET14)",
    "ONDC:RET15": "Appliances (RET15)",
    "ONDC:RET16": "Home & Kitchen (RET16)",
    "ONDC:RET18": "Health & Wellness (RET18)",
    "ONDC:RETeB2B": "eB2B (DigiDukaan) (RETeB2B)",
    "ONDC:RETINVL": "Inventory Less (RETINVL)",
    "ONDC:FIS10": "Gift Cards (FIS10)",
    "ONDC:FIS11": "Metro Card Recharge (FIS11)",
    "ONDC:FIS12": "Credit (FIS12)",
    "ONDC:FIS12:BL": "Business Loan (FIS12:BL)",
    "ONDC:FIS12:PF": "Solar Purchase Finance (FIS12:PF)",
    "ONDC:FIS12:SL": "Loan Against Mutual Funds (FIS12:SL)",
    "ONDC:FIS13": "Insurance (FIS13)",
    "ONDC:FIS14": "Investment (FIS14)",
};

/** Label for the Scenario Testing domain select; falls back to the raw key for any domain not in the map. */
export const getScenarioDomainLabel = (domainKey: string): string =>
    SCENARIO_DOMAIN_LABELS[domainKey] ?? domainKey;

/**
 * Domain select options, sorted for the user: domains with a friendly label
 * first (alphabetically by that label), then domains with no friendly label
 * (showing their raw code, e.g. AGR10, NTS10) at the end, alphabetically by
 * that code. Display order only — each option's value is still the domain's
 * own key, unchanged.
 */
export const sortedDomainOptions = (domains: IDomain[]): { value: string; label: string }[] => {
    const labeled: { value: string; label: string }[] = [];
    const unlabeled: { value: string; label: string }[] = [];
    domains.forEach((d) => {
        const entry = { value: d.key, label: getScenarioDomainLabel(d.key) };
        (d.key in SCENARIO_DOMAIN_LABELS ? labeled : unlabeled).push(entry);
    });
    const byLabel = (a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label);
    return [...labeled.sort(byLabel), ...unlabeled.sort(byLabel)];
};

export const LS_KEY = "flowTestingSessions";
export const SESSIONS_PER_PAGE = 4;
