import React from "react";

// Generic Form With Paste interfaces
export interface IParsedOnSearchData {
    item_id?: string;
    quantity?: string;
    add_on_id?: string;
    adults_count?: string;
    children_count?: string;
    provider_id?: string;
    location_id?: string;
}

export interface ICatalogItem {
    id: string;
    name: string;
    addOns: { id: string; name: string }[];
}

export interface IGenericFormWithPasteProps {
    defaultValues?: Record<string, unknown>;
    children: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => Promise<void>;
    className?: string;
    triggerSubmit?: boolean;
    enablePaste?: boolean;
}

// Default values
export const DEFAULT_PARSED_DATA: IParsedOnSearchData = {
    item_id: "",
    quantity: "1",
    add_on_id: "",
    adults_count: "1",
    children_count: "0",
};
