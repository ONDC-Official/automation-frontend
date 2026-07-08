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
    order_type: "ILBN" | "ILFP" | "ILBP";
    items: {
        itemId: string;
        quantity: number;
        location: string;
        bidding_price: number;
    }[];
} & Partial<Record<IOfferKey, boolean>>;

export interface IRetINVLInitILBPFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}

export const DEFAULT_FORM_VALUES: IFormValues = {
    city_code: "",
    provider: "",
    provider_location: [],
    location_gps: "",
    location_pin_code: "",
    order_type: "ILBN",
    items: [
        { itemId: "", quantity: 1, location: "", bidding_price: 0 },
        { itemId: "", quantity: 1, location: "", bidding_price: 0 },
    ],
};
