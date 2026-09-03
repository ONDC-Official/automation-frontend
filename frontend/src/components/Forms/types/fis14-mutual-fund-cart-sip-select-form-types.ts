import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form";

// ─── Re-exported raw ONDC types (shared with SIP select form) ────────────────

export interface IRawTag {
    descriptor?: { name?: string; code?: string };
    list?: { descriptor?: { name?: string; code?: string }; value?: string }[];
}

export interface IRawItem {
    id: string;
    descriptor?: { name?: string; code?: string };
    parent_item_id?: string;
    fulfillment_ids?: string[];
    tags?: IRawTag[];
}

export interface IRawFulfillment {
    id: string;
    type: string;
    tags?: IRawTag[];
}

export interface IRawProvider {
    id: string;
    descriptor?: { name?: string };
    items?: IRawItem[];
    fulfillments?: IRawFulfillment[];
}

export interface IOnSearchPayload {
    context?: Record<string, unknown>;
    message?: { catalog?: { providers?: IRawProvider[] } };
}

// ─── Parsed / internal types ─────────────────────────────────────────────────

export interface IThresholdInfo {
    frequency?: string;
    frequencyDates?: string;
    frequencyDayType?: string;
    amountMin?: string;
    amountMax?: string;
    amountMultiples?: string;
    installmentsMin?: string;
    installmentsMax?: string;
    cumulativeAmountMin?: string;
}

export interface IParsedFulfillment {
    id: string;
    type: string;
    thresholds: IThresholdInfo;
}

export interface IParsedItem {
    id: string;
    name: string;
    fulfillmentIds: string[];
}

export interface IParsedProvider {
    id: string;
    name: string;
    items: IParsedItem[];
    fulfillments: IParsedFulfillment[];
}

export interface ICatalogData {
    providers: IParsedProvider[];
}

export interface IAgentCred {
    id: string;
    type: string;
}

// ─── Cart-specific types ──────────────────────────────────────────────────────

/** One row in the cart items list. */
export interface ICartItemRow {
    itemId: string;
    amount: string;
}

/** Form values for the Cart SIP Select form. */
export interface ICartFormValues {
    providerId: string;
    fulfillmentId: string;
    cartItems: ICartItemRow[];
    installments: string;
    startDate: string;
    sipDay: string;
    customerPersonId: string;
    folioId: string;
    agentPersonId: string;
    agentCreds: IAgentCred[];
    staticTermsUrl: string;
}

export interface IFIS14MutualFundCartSIPSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}

export const DEFAULT_CART_FORM_VALUES: ICartFormValues = {
    providerId: "",
    fulfillmentId: "",
    cartItems: [{ itemId: "", amount: "" }],
    installments: "",
    startDate: "",
    sipDay: "",
    customerPersonId: "",
    folioId: "",
    agentPersonId: "",
    agentCreds: [{ id: "", type: "" }],
    staticTermsUrl: "https://buyerapp.com/legal/ondc:fis14/static_terms?v=0.1",
};
