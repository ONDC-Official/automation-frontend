import { SubmitEventParams } from "@/types/flow-types";

export interface IFis13ManualBapInput {
    code: string;
    label: string;
    type: string;
}

export interface IDynamicInput {
    descriptor: { code: string; short_desc?: string };
    value: string;
}

export interface ICatalogItem {
    id: string;
    tags?: Array<{
        descriptor?: { code?: string };
        list?: IDynamicInput[];
    }>;
}

export interface IProvider {
    id: string;
    tags?: unknown[];
    items?: ICatalogItem[];
}

export interface IFIS13InsuranceSearchFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
    manualBapInputs: IFis13ManualBapInput[];
    pasteHint?: string;
}
