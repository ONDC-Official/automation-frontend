import { SubmitEventParams } from "@/types/flow-types";

export interface IHotelCatalogItem {
    id: string;
    name: string;
    locationIds: string[];
    addOns: { id: string; name: string }[];
}

export interface IHotelFormData {
    itemId: string;
    quantity: number;
    addOnId: string;
    adultsCount: number;
    childrenCount: number;
    providerId: string;
    locationId: string;
}

export interface IHotelSelectProps {
    submitEvent: (params: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_HOTEL_FORM_DATA: IHotelFormData = {
    itemId: "",
    quantity: 1,
    addOnId: "",
    adultsCount: 1,
    childrenCount: 0,
    providerId: "",
    locationId: "",
};
