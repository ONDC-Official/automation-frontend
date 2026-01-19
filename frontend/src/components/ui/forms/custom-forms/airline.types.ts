import { SubmitEventParams } from "@/types/flow-types";

// Airline Select interfaces
export interface IFormItem {
    itemId: string;
    count: number;
    addOnId: string;
    addOnCount: number;
}

export interface IFormData {
    provider: string;
    fulfillment: string;
    items: IFormItem[];
}

export interface ICatalogItem {
    id: string;
    name: string;
    addOns: { id: string; name: string }[];
}

export interface IAirlineSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    defaultValues?: IFormData;
}

// Airline Seat Select interfaces
export interface ISeatFormData {
    seats: { seatNumber: string }[];
}

export interface IAirlineSeatSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    defaultValues?: ISeatFormData;
}

// Default values for components - used as fallback when no props provided
export const DEFAULT_FORM_DATA: IFormData = {
    provider: "",
    fulfillment: "",
    items: [
        {
            itemId: "",
            count: 1,
            addOnId: "",
            addOnCount: 1,
        },
    ],
};

export const DEFAULT_SEAT_FORM_DATA: ISeatFormData = {
    seats: [{ seatNumber: "" }],
};

// Shared style constants
export const FORM_STYLES = {
    inputStyle:
        "border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white",
    labelStyle: "mb-1 font-semibold text-sm",
    fieldWrapperStyle: "flex flex-col mb-2",
} as const;

// --- Payload Parsing Interfaces ---

export interface IDescriptor {
    code?: string;
    name?: string;
    short_desc?: string;
}

export interface ITagListItem {
    descriptor?: IDescriptor;
    value?: string;
}

export interface ITag {
    descriptor: IDescriptor;
    display?: boolean;
    list: ITagListItem[];
}

export interface IItem {
    id: string;
    descriptor: {
        name: string;
        code: string;
    };
    quantity: {
        selected: {
            count: number;
        };
    };
    tags?: ITag[];
    category_ids?: string[];
    fulfillment_ids?: string[];
    parent_item_id?: string;
}

export interface IFulfillment {
    id: string;
    type: string;
    tags?: ITag[];
}

export interface IProtocolOrder {
    items: IItem[];
    fulfillments: IFulfillment[];
}

export interface IProtocolMessage {
    order: IProtocolOrder;
}

export interface IContext {
    action: string;
    transaction_id: string;
    bpp_id: string;
    bpp_uri: string;
}

export interface ISelectPayload {
    context: IContext;
    message: IProtocolMessage;
}

// Seat Grid Structures
export interface IVehicleGrid {
    xMax: number;
    yMax: number;
    zMax: number;
    xLobbyStart: number;
    xLobbySize: number;
    yLobbyStart: number;
    yLobbySize: number;
}

export interface ISeatDetail {
    x: number;
    y: number;
    z: number;
    seatNumber: string;
    price: string;
    available: boolean;
    fulfillmentId: string;
}

export interface IParsedFlightData {
    items: IItem[];
    fulfillmentId: string;
    grid: IVehicleGrid;
    availableSeats: ISeatDetail[]; // Extracted from TICKET fulfillments
    providerId?: string;
}
