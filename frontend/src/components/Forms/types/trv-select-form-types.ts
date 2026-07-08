import { SubmitEventParams } from "@/types/flow-types";

export interface ICatalogAddOn {
    id: string;
}

export interface ICatalogItem {
    id: string;
    parent_item_id?: string;
    add_ons?: ICatalogAddOn[];
    fulfillment_ids?: string[];
}

export interface ICatalogFulfillmentStop {
    type: string;
    instructions?: Record<string, unknown>;
    time?: Record<string, unknown>;
}

export interface ICatalogFulfillment {
    id: string;
    type?: string;
    stops?: ICatalogFulfillmentStop[];
    agent?: Record<string, unknown>;
    vehicle?: Record<string, unknown>;
}

export interface ICatalogProvider {
    id: string;
    items?: ICatalogItem[];
    fulfillments?: ICatalogFulfillment[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: ICatalogProvider[];
        };
    };
}

export interface IExtractedItem {
    itemid: string;
    parentItemId: string;
    providerid: string;
    addOns: string[];
    fulfillmentIds: string[];
}

export interface IFormItem {
    itemId: string;
    count: number;
    addOns: string[];
    addOnsQuantity: number;
    parentItemId?: string;
}

export interface IFormValues {
    provider: string;
    items: IFormItem[];
    fulfillmentId: string;
}

export interface ITRVSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    flowId?: string;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    provider: "",
    items: [{ itemId: "", count: 1, addOns: [], addOnsQuantity: 1 }],
    fulfillmentId: "",
};
