import { SubmitEventParams } from "@/types/flow-types";

export interface ITargetListItem {
    code: string;
    value: string;
    descriptor?: { code?: string };
}

export interface ITag {
    code: string;
    list?: ITargetListItem[];
    descriptor?: { code?: string };
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
        name?: string;
    };
    item_ids?: string[];
    location_ids?: string[];
    category_ids?: string[];
    tags?: ITag[];
    items?: string[];
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

export interface ICatalogProvider {
    id: string;
    descriptor?: {
        name?: string;
        code?: string;
        short_desc?: string;
    };
    items: ICatalogItemFull[];
    locations: ICatalogLocation[];
    categories?: ICatalogCategory[];
    fulfillments?: ICatalogFulfillment[];
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

export interface IReteB2BInitOffersFormProps {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}
