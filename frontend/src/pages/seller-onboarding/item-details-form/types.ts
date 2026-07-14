import type { ItemDetails, SellerOnboardingData } from "@pages/seller-onboarding";

export interface ItemDetailsFormProps {
    initialData: SellerOnboardingData;
    onNext: (data: Partial<SellerOnboardingData>) => void | Promise<void>;
    onPrevious: () => void;
}

export interface FormData {
    items: ItemDetails[];
}

export interface ItemVariant extends ItemDetails {
    variantOf: number;
    variantId: string;
    variantCombination: { [attribute: string]: string };
    isVariant: true;
}

export interface AttributeConfig {
    mandatory: boolean;
    value: string[] | string;
}
