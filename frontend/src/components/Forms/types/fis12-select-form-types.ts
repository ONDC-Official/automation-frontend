import { SubmitEventParams } from "@/types/flow-types";

export interface IDescriptor {
    name?: string;
    code?: string;
    short_desc?: string;
}

export interface IPrice {
    currency: string;
    value: string;
}

export interface IItem {
    id: string;
    descriptor?: IDescriptor;
    price?: IPrice;
    parent_item_id?: string;
    [key: string]: unknown;
}

export interface IProvider {
    id: string;
    descriptor?: IDescriptor;
    items?: IItem[];
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

export interface IFIS12SelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    providerId: "",
    itemId: "",
};
