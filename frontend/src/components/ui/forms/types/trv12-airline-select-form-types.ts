import { SubmitEventParams } from "@/types/flow-types";

export interface IFormItem {
    itemId: string;
    count: number;
    addOnId: string;
    addOnCount: number;
}

export interface IFormData {
    provider: string;
    fulfillment: string;
    items: IFormItem[];
}

export interface ICatalogItem {
    id: string;
    name: string;
    addOns: { id: string; name: string }[];
}

export interface ICatalogAddOn {
    id: string;
    descriptor?: { name?: string };
}

export interface ICatalogItemRaw {
    id: string;
    descriptor?: { name?: string };
    add_ons?: ICatalogAddOn[];
}

export interface ICatalogFulfillment {
    id: string;
}

export interface ICatalogProvider {
    id: string;
    items?: ICatalogItemRaw[];
    fulfillments?: ICatalogFulfillment[];
}

export interface IOnSearchPayload {
    message?: { catalog?: { providers?: ICatalogProvider[] } };
}

export interface IAirlineSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    defaultValues?: IFormData;
}

export const DEFAULT_FORM_DATA: IFormData = {
    provider: "",
    fulfillment: "",
    items: [{ itemId: "", count: 1, addOnId: "", addOnCount: 1 }],
};
