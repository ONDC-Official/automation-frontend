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
    fd: { subscriberId: "", ukId: "", signingPublicKey: "", declaration: "" },
};

/** Friendly labels for the Scenario Testing "Select Domain" field, keyed by the raw domain key the API returns. */
export const SCENARIO_DOMAIN_LABELS: Record<string, string> = {
    "nic2004:60232": "Logistics 1.2.0 (nic2004:60232)",
    "ONDC:LOG10": "Logistics 1.2.5 P2P (LOG10)",
    "ONDC:LOG11": "Logistics 1.2.5 P2H2P (LOG11)",
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
    "ONDC:FIS14:FD": "Fixed Deposit (FIS14:FD)",
};

/** Label for the Scenario Testing domain select; falls back to the raw key for any domain not in the map. */
export const getScenarioDomainLabel = (domainKey: string): string =>
    SCENARIO_DOMAIN_LABELS[domainKey] ?? domainKey;

export const LS_KEY = "flowTestingSessions";
export const SESSIONS_PER_PAGE = 4;
