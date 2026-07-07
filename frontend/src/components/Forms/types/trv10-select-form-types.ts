import { SubmitEventParams } from "@/types/flow-types";

export interface IAddOnInfo {
    id: string;
    maxQuantity: number;
}

export interface IExtractedItem {
    itemid: string;
    providerid: string;
    addOns: IAddOnInfo[];
}

export interface IAddOnSelection {
    id: string;
    quantity: number;
}

export interface IFormItem {
    itemId: string;
    count: number;
    addOns: IAddOnSelection[];
    providerid: string;
}

export interface IFormValues {
    provider: string;
    items: IFormItem[];
}

export interface ICatalogAddOn {
    id: string;
    quantity?: { maximum?: { count?: number } };
}

export interface ICatalogItem {
    id: string;
    add_ons?: ICatalogAddOn[];
}

export interface ICatalogProvider {
    id: string;
    items?: ICatalogItem[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: ICatalogProvider[];
        };
    };
}

export interface ITRV10SelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    provider: "",
    items: [{ itemId: "", count: 1, addOns: [], providerid: "" }],
};
