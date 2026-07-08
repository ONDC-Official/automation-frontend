import { SubmitEventParams } from "@/types/flow-types";

export interface IItem {
    id: string;
    name: string;
    maxQuantity: number;
    minQuantity: number;
}

export interface ISelectedItem {
    itemId: string;
    itemQuantity: string;
}

export interface IOnSearchPayload {
    message?: {
        catalog?: {
            providers?: Array<{
                items?: unknown[];
            }>;
        };
    };
}

export interface IRawCatalogItem {
    id: string;
    descriptor?: { name?: string };
    quantity?: {
        maximum?: { count?: number };
        minimum?: { count?: number };
    };
}

export interface ITrv11210MetroSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_SELECTED_ITEMS: ISelectedItem[] = [{ itemId: "", itemQuantity: "" }];
