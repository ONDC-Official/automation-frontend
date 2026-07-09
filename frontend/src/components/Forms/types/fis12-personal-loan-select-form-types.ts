import { SubmitEventParams } from "@/types/flow-types";

// ─── Raw on_search payload shapes ────────────────────────────────────────────

export interface IRawDescriptor {
    name?: string;
    code?: string;
    short_desc?: string;
    long_desc?: string;
    images?: { url: string; size_type?: string }[];
}

export interface IRawTagListEntry {
    descriptor?: { code?: string; name?: string; short_desc?: string };
    value?: string;
}

export interface IRawTag {
    descriptor?: { code?: string; name?: string };
    list?: IRawTagListEntry[];
    display?: boolean;
}

export interface IRawXInputForm {
    id: string;
    mime_type?: string;
    url?: string;
    resubmit?: boolean;
    multiple_sumbissions?: boolean;
}

export interface IRawXInput {
    head?: {
        descriptor?: { name?: string };
        index?: { min: number; cur: number; max: number };
        headings?: string[];
    };
    form?: IRawXInputForm;
    required?: boolean;
}

export interface IRawStop {
    id: string;
    parent_stop_id?: string;
    type: string;
    instructions?: { name?: string; code?: string; short_desc?: string };
}

export interface IRawFulfillment {
    id: string;
    type: string;
    stops?: IRawStop[];
}

export interface IRawItem {
    id: string;
    descriptor?: IRawDescriptor;
    category_ids?: string[];
    fulfillment_ids?: string[];
    tags?: IRawTag[];
    xinput?: IRawXInput;
}

export interface IRawProvider {
    id: string;
    descriptor?: IRawDescriptor;
    items?: IRawItem[];
    fulfillments?: IRawFulfillment[];
    tags?: IRawTag[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: IRawProvider[];
        };
    };
}

// ─── Parsed / normalised data ─────────────────────────────────────────────────

export interface IGeneralInfo {
    minInterestRate?: string;
    maxInterestRate?: string;
    minTenure?: string;
    maxTenure?: string;
    minLoanAmount?: string;
    maxLoanAmount?: string;
}

export interface IParsedStop {
    id: string;
    type: string;
    name?: string;
    code?: string;
    shortDesc?: string;
}

export interface IParsedFulfillment {
    id: string;
    type: string;
    stops: IParsedStop[];
}

export interface IParsedXInput {
    formId: string;
    url?: string;
}

export interface IParsedItem {
    id: string;
    name: string;
    code?: string;
    fulfillmentIds: string[];
    generalInfo: IGeneralInfo;
    xinput?: IParsedXInput;
}

export interface IParsedProvider {
    id: string;
    name: string;
    items: IParsedItem[];
    fulfillments: IParsedFulfillment[];
}

// ─── Form state ───────────────────────────────────────────────────────────────

export interface IFormValues {
    providerId: string;
    itemId: string;
    /** Populated only when the selected item has an xinput form */
    formSubmissionId: string;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    providerId: "",
    itemId: "",
    formSubmissionId: "",
};

// ─── Component props ──────────────────────────────────────────────────────────

export interface IFIS12PersonalLoanSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}
