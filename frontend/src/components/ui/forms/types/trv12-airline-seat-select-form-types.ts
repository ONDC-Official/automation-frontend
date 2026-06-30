import { SubmitEventParams } from "@/types/flow-types";

export interface ISeatFormData {
    seats: { seatNumber: string }[];
}

export interface IAirlineSeatSelectProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
    defaultValues?: ISeatFormData;
}

export const DEFAULT_SEAT_FORM_DATA: ISeatFormData = {
    seats: [{ seatNumber: "" }],
};

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
    descriptor: { name: string; code: string };
    quantity: { selected: { count: number } };
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
    availableSeats: ISeatDetail[];
    providerId?: string;
}
