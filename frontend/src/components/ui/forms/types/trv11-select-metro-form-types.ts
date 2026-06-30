import { SubmitEventParams } from "@/types/flow-types";

export interface ICatalogItem {
    id: string;
    descriptor: { code: string; name: string };
    price: { currency: string; value: string };
    quantity: {
        minimum: { count: number };
        maximum: { count: number };
    };
}

export interface IFormItem {
    itemId: string;
    count: number;
}

export interface IFormValues {
    items: IFormItem[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                items?: ICatalogItem[];
            }>;
        };
    };
}

export interface ITRV11SelectMetroFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    items: [{ itemId: "", count: 1 }],
};
