import { SubmitEventParams } from "@/types/flow-types";

export interface IFulfillmentTagListItem {
    descriptor: { code: string };
    value: string;
}

export interface IFulfillmentTag {
    descriptor: { code: string };
    list: IFulfillmentTagListItem[];
}

export interface IFulfillment {
    type?: string;
    tags?: IFulfillmentTag[];
}

export interface IOnSelectPayload {
    message?: {
        order?: {
            fulfillments?: IFulfillment[];
        };
    };
}

export interface ISeatSelectionFormValues {
    items: Array<{ seatNumber: string }>;
}

export interface ITRV12BusSeatCountSelectionFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    payload?: IOnSelectPayload;
}

export const DEFAULT_SEAT_SELECTION_FORM_VALUES: ISeatSelectionFormValues = {
    items: [{ seatNumber: "" }],
};
