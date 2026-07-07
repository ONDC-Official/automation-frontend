import { SubmitEventParams } from "@/types/flow-types";

export interface IDescriptor {
    name?: string;
    code?: string;
    short_desc?: string;
    long_desc?: string;
}

export interface IXInputForm {
    id: string;
    mime_type?: string;
    url?: string;
    multiple_sumbissions?: boolean;
    resubmit?: boolean;
}

export interface IXInputHead {
    descriptor?: { name?: string };
    headings?: string[];
    index?: { cur: number; max: number; min: number };
}

export interface IXInput {
    form: IXInputForm;
    head?: IXInputHead;
    required?: boolean;
}

export interface IItem {
    id: string;
    descriptor?: IDescriptor;
    category_ids?: string[];
    xinput?: IXInput;
    [key: string]: unknown;
}

export interface IProvider {
    id: string;
    descriptor?: IDescriptor & { images?: { url: string; size_type?: string }[] };
    items?: IItem[];
    categories?: { id: string; descriptor?: IDescriptor; parent_category_id?: string }[];
    [key: string]: unknown;
}

export interface IFormValues {
    providerId: string;
    itemId: string;
}

export interface ICatalogPayload {
    message?: {
        catalog?: {
            providers?: IProvider[];
        };
    };
}

export interface IFIS12SearchFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    providerId: "",
    itemId: "",
};
