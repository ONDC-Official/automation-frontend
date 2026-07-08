import { SubmitEventParams } from "@/types/flow-types";

export interface IAddOn {
    id: string;
    descriptor?: {
        name?: string;
        code?: string;
    };
    price?: {
        currency?: string;
        value?: string;
    };
    quantity?: {
        available?: { count?: number };
        maximum?: { count?: number };
    };
}

export interface ISelectedAddOn {
    id: string;
    quantity: number;
}

export interface IFIS13AddonSelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    referenceData?: Record<string, unknown>;
}
