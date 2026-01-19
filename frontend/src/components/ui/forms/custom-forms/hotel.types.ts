import { SubmitEventParams } from "@/types/flow-types";

// Hotel Select interfaces
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

// Default values
export const DEFAULT_HOTEL_FORM_DATA: IHotelFormData = {
    itemId: "",
    quantity: 1,
    addOnId: "",
    adultsCount: 1,
    childrenCount: 0,
    providerId: "",
    locationId: "",
};

// Shared style constants
export const HOTEL_FORM_STYLES = {
    inputStyle: "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
    labelStyle: "block text-sm font-medium text-gray-700 mb-1",
    fieldWrapperStyle: "mb-4",
    sectionStyle: "border p-4 rounded-lg bg-gray-50 mb-4",
} as const;
