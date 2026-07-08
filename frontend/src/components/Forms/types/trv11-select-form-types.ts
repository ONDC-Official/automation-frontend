import { SubmitEventParams } from "@/types/flow-types";

export interface IExtractedItem {
    itemid: string;
    providerid: string;
}

export interface IFormItem {
    itemId: string;
    count: number;
    addOns?: string[];
    location?: string;
}

export interface IFormValues {
    provider: string;
    items: IFormItem[];
    fulfillment?: string;
}

export interface ICatalogItem {
    id: string;
}

export interface ICatalogFulfillment {
    id: string;
    type?: string;
}

export interface ICatalogProvider {
    id: string;
    fulfillments?: ICatalogFulfillment[];
    items?: ICatalogItem[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: ICatalogProvider[];
        };
    };
}

export interface ITRV11SelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    provider: "",
    items: [{ itemId: "", count: 1, addOns: [] }],
    fulfillment: "",
};
