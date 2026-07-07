import { SubmitEventParams } from "@/types/flow-types";

export interface ICatalogAddOn {
    id: string;
    descriptor?: { name?: string; code?: string };
    price?: { value?: string; currency?: string };
    quantity?: { available?: { count?: number }; maximum?: { count?: number } };
}

export interface ICatalogItem {
    id: string;
    descriptor?: { name?: string; short_desc?: string };
    category_ids?: string[];
    add_ons?: ICatalogAddOn[];
    parent_item_id?: string;
}

export interface ICatalogFulfillment {
    id: string;
    type?: string;
}

export interface ICatalogProvider {
    id: string;
    descriptor?: { name?: string };
    items?: ICatalogItem[];
    fulfillments?: ICatalogFulfillment[];
}

export interface IParsedCatalog {
    provider: ICatalogProvider;
    items: ICatalogItem[];
    fulfillmentId: string;
}

export interface ISelectedAddOn {
    id: string;
    quantity: number;
}

export interface IFormValues {
    selectedItemIndex: number;
}

export interface IInsuranceSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    selectedItemIndex: 0,
};
