import { SubmitEventParams } from "@/types/flow-types";

export type IOfferKey = `offers_${string}`;

export interface ICatalogItem {
    id: string;
}

export interface ICatalogLocation {
    id: string;
}

export type CatalogLocation = ICatalogLocation;

export interface ICatalogOffer {
    id: string;
}

export interface ICatalogProvider {
    id: string;
    items: ICatalogItem[];
    locations: ICatalogLocation[];
    offers?: ICatalogOffer[];
}

export type CatalogProvider = ICatalogProvider;

export interface IOnSearchPayload {
    message: {
        catalog: {
            "bpp/providers": ICatalogProvider[];
        };
    };
}

export type IFormValues = {
    city_code: string;
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
    items: {
        itemId: string;
        quantity: number;
        location: string;
    }[];
} & Partial<Record<IOfferKey, boolean>>;

export type IFormData = {
    city_code: string;
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
    items: {
        itemId: string;
        quantity: number;
        location: string;
    }[];
} & Partial<Record<IOfferKey, boolean>>;

export type IFormDataRET11 = {
    provider: string;
    provider_location: string[];
    location_gps: string;
    location_pin_code: string;
} & Partial<Record<IOfferKey, boolean>>;

export interface IRet10GrocerySelectFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    city_code: "",
    provider: "",
    provider_location: [],
    location_gps: "",
    location_pin_code: "",
    items: [
        { itemId: "", quantity: 1, location: "" },
        { itemId: "", quantity: 1, location: "" },
    ],
};
