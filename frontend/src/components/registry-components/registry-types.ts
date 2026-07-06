export type { Key, Mapping, SubscriberData } from "@/types/apiShared/registry";

export interface Uri {
    id: string;
    uri: string;
}

export interface Location {
    id: string;
    city: string[];
    country: string[];
}
