import { SubmitEventParams } from "@/types/flow-types";

export interface IFormData {
    providerId: string;
    itemId: string;
    fulfillmentId: string;
}

export interface IProvider {
    id: string;
    items: { id: string; name: string; fulfillment_ids: string[] }[];
    fulfillments: { id: string }[];
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: Array<{
                id: string;
                items?: Array<{
                    id: string;
                    descriptor?: { name?: string };
                    fulfillment_ids?: string[];
                }>;
                fulfillments?: Array<{ id: string }>;
            }>;
        };
    };
}

export interface ITRV10RideHailingSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_DATA: IFormData = {
    providerId: "",
    itemId: "",
    fulfillmentId: "",
};
