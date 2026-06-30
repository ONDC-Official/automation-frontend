import { SubmitEventParams } from "@/types/flow-types";

export interface IHotelProvider {
    id: string;
    name: string;
}

export interface IHotelProviderFormData {
    providerId: string;
    providerName: string;
    checkInDate: string;
    checkOutDate: string;
}

export interface IHotelProviderSelectProps {
    submitEvent: (params: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_HOTEL_PROVIDER_FORM_DATA: IHotelProviderFormData = {
    providerId: "",
    providerName: "",
    checkInDate: "",
    checkOutDate: "",
};
