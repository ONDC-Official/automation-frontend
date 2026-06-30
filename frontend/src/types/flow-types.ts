import { DynamicOfferRule } from "@/components/ui/forms/types/reteb2b-select-form-types";
import { FormConfigType } from "@/components/ui/forms/config-form/types";

// Define your data types
export interface FetchFlowsResponse {
    domain: Domain[];
}

export interface Domain {
    name: string;
    flows: Flow[];
}

export interface Flow {
    id: string;
    title?: string;
    description: string;
    sequence: SequenceStep[];
    extraSequence: SequenceStep[];
    metadata?: MetadataField[];
    tags?: [string];
}

export interface MetadataField {
    path: string;
    description: {
        code: string;
        name: string;
        short_desc: string;
    };
}

export interface SequenceStep {
    key: string;
    type: string;
    unsolicited: boolean;
    description?: string;
    pair: string | null;
    owner: "BAP" | "BPP";
    input?: FormConfigType;
    expect?: boolean;
    label?: string;
    force_proceed?: boolean;
    metadata?: MetadataField[];
    repeat?: number;
    "meta-data"?: MetadataField[];
    manual?: boolean;
}

export type OnSearchPayload = {
    message: {
        catalog: {
            "bpp/providers": unknown[];
        };
    };
};

export interface SubmitEventParams {
    jsonPath: Record<string, unknown>;
    formData: Record<string, string>;
    catalog?: OnSearchPayload;
    offerRules?: Record<string, DynamicOfferRule>;
}
