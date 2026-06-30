import { SubmitEventParams } from "@/types/flow-types";

export interface ICatalogItem {
    id: string;
}

export interface ITargetListItem {
    code: string;
    value: string;
}

export interface ITag {
    code: string;
    list?: ITargetListItem[];
}

export interface IDynamicOfferRule {
    id: string;
    itemIds: string[];
    categoryIds: string[];
    locationIds: string[];
    minOrderValue?: number;
    minItemCount?: number;
    maxItemCount?: number;
    isAdditive: boolean;
}

export type DynamicOfferRule = IDynamicOfferRule;

export interface ICatalogLocation {
    id: string;
}

export type CatalogLocation = ICatalogLocation;

export interface ICatalogOffer {
    id: string;
    descriptor: {
        code: string;
    };
    item_ids?: string[];
    location_ids?: string[];
    category_ids?: string[];
    tags?: ITag[];
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

export interface IFormValues {
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
        estimated_price: number;
    }[];
    available_offers: string[];
}

export interface IRetINVLInitOffersFormProps {
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
        { itemId: "", quantity: 1, location: "", estimated_price: 0 },
        { itemId: "", quantity: 1, location: "", estimated_price: 0 },
    ],
    available_offers: [],
};
