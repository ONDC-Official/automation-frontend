import { SubmitEventParams } from "@/types/flow-types";

export interface ICatalogItem {
    id: string;
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                fulfillments?: Array<{ id: string }>;
                items?: ICatalogItem[];
            }>;
        };
    };
}

export interface IFormData {
    provider: string;
    fulfillment: string;
    itemId: string;
    count: number;
}

export interface ITRV12IntercitySelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_DATA: IFormData = {
    provider: "",
    fulfillment: "",
    itemId: "",
    count: 1,
};
