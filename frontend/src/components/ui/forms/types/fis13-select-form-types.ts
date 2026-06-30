import { SubmitEventParams } from "@/types/flow-types";

export interface IExtractedAddon {
    id: string;
    parent_item_id: string;
    descriptor?: { name?: string; code?: string };
    price?: { currency?: string; value?: string };
    quantity?: { available?: { count?: number }; maximum?: { count?: number } };
}

export interface IExtractedItem {
    id: string;
    parent_item_id: string;
    descriptor?: { name?: string };
    // Categories the item belongs to, as listed in the on_search catalogue.
    category_ids?: string[];
    add_ons: IExtractedAddon[];
}

export interface ISelectedAddon {
    id: string;
    quantity: number;
}

export interface IFormValues {
    selectedItems: IExtractedItem[];
}

export interface IRawAddon {
    id: string;
    descriptor?: { name?: string; code?: string };
    price?: { currency?: string; value?: string };
    quantity?: { available?: { count?: number }; maximum?: { count?: number } };
}

export interface IOrderItem {
    id: string;
    parent_item_id?: string;
    descriptor?: { name?: string };
    category_ids?: string[];
    add_ons?: IRawAddon[];
}

export interface IPayload {
    message?: {
        order?: { items?: IOrderItem[] };
        catalog?: { providers?: Array<{ items?: IOrderItem[] }> };
    };
}

export interface IFIS13SelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    selectedItems: [],
};
