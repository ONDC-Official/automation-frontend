import { SubmitEventParams } from "@/types/flow-types";
import { FormFieldConfigType } from "../config-form";

export interface IRawItem {
    id: string;
    descriptor?: { name?: string; code?: string };
    parent_item_id?: string;
    fulfillment_ids?: string[];
}

export interface IRawFulfillment {
    id: string;
    type: string;
}

export interface IRawProvider {
    id: string;
    descriptor?: { name?: string };
    items?: IRawItem[];
    fulfillments?: IRawFulfillment[];
}

export interface IOnSearchPayload {
    context?: Record<string, unknown>;
    message?: { catalog?: { providers?: IRawProvider[] } };
}

export interface IParsedProvider {
    id: string;
    name: string;
    items: { id: string; name: string; fulfillmentIds: string[] }[];
    fulfillments: { id: string; type: string }[];
}

export interface ICatalogData {
    providers: IParsedProvider[];
    context: IOnSearchPayload["context"];
}

export interface ICred {
    id: string;
    type: string;
}

export interface IFormValues {
    providerId: string;
    fulfillmentId: string;
    creds: ICred[];
    personId: string;
    customerPersonId: string;
    itemId: string;
    itemValue: string;
}

export interface IFIS14MutualFundSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    formConfig?: FormFieldConfigType[];
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    providerId: "",
    fulfillmentId: "",
    creds: [{ id: "", type: "" }],
    personId: "",
    customerPersonId: "",
    itemId: "",
    itemValue: "",
};
