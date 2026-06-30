import { SubmitEventParams } from "@/types/flow-types";

export interface IItem {
    id: string;
    descriptor?: {
        name?: string;
        code?: string;
    };
    fulfillment_ids?: string[];
    quantity?: {
        minimum?: { count: number };
        maximum?: { count: number };
    };
}

export interface IFulfillmentCred {
    type: string;
    id?: string;
}

export interface IFulfillment {
    id: string;
    type: string;
    customer?: {
        person?: {
            creds?: IFulfillmentCred[];
        };
    };
}

export interface IProvider {
    id: string;
    descriptor?: {
        name?: string;
    };
    items?: IItem[];
    fulfillments?: IFulfillment[];
}

export interface IOnSearchPayload {
    context: Record<string, unknown>;
    message: {
        catalog: {
            providers: IProvider[];
        };
    };
}

export interface ITRV11Metro210CommonItemFulfillmentSelectionFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    flowId?: string;
}
