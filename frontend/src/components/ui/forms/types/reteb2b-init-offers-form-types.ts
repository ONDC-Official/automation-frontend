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
    items: ICatalogItemFull[];
    locations: ICatalogLocation[];
    categories?: ICatalogCategory[];
    fulfillments?: ICatalogFulfillment[];
    offers?: ICatalogOffer[];
}

export type CatalogProvider = ICatalogProvider;

export interface ITargetListItem {
    code: string;
    value: string;
}

export interface IOnSearchPayload {
    message: {
        catalog: {
            "bpp/providers": ICatalogProvider[];
        };
    };
}

export interface IReteB2BItem {
    itemId: string;
    quantity: number;
    location: string;
    fulfillment_id: string;
}

export interface IRetailerCustomerInput {
    type: "new" | "existing";
    customer_id?: string;
    phone_number?: string;
    email?: string;
    tax_number?: string;
    provider_tax_number?: string;
    shop_name?: string;
    address?: string;
    city_code: string;
    state_code?: string;
    available_offers?: string[];
    items: IReteB2BItem[];
}

export interface ICatalogFulfillment {
    id: string;
}

export interface ICatalogCategory {
    id: string;
    descriptor?: { name?: string };
}

export interface ICatalogItemFull {
    id: string;
    descriptor?: { name?: string };
    category_id?: string;
    category_ids?: string[];
    price?: { value?: string };
    tags?: ITag[];
    location_id?: string;
    location_ids?: string[];
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

export interface IReteB2BInitOffersFormProps {
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
