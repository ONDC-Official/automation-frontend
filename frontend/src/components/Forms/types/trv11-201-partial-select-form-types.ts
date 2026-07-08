import { SubmitEventParams } from "@/types/flow-types";

export interface IOrderFulfillment {
    id: string;
    type: string;
}

export interface IOnConfirmPayload {
    message?: {
        order?: {
            items?: unknown[];
            fulfillments?: IOrderFulfillment[];
        };
    };
}

export interface IFormValues {
    fulfillmentId: string;
}

export interface ITRV11PartialSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    fulfillmentId: "",
};
