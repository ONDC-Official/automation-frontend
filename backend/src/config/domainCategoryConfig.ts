export enum DomainType {
    GROCERY = "Grocery",
    FASHION = "Fashion",
    BPC = "BPC",
    ELECTRONICS = "Electronics",
    APPLIANCES = "Appliances",
    HOME_KITCHEN = "Home & Kitchen",
    HEALTH_WELLNESS = "Health & Wellness",
    FNB = "F&B"
}

export const DOMAIN_CATEGORY_MAP: Record<string, string[]> = {
    [DomainType.GROCERY]: [
        "Fruits and Vegetables",
        "Foodgrains",
        "Oil & Masala",
        "Beverages",
        "Snacks"
    ],
    [DomainType.FASHION]: [
        "Clothing",
        "Footwear",
        "Accessories",
        "Jewelry",
        "Bags"
    ],
    [DomainType.BPC]: [
        "Skincare",
        "Haircare",
        "Makeup",
        "Fragrances",
        "Personal Care"
    ],
    [DomainType.ELECTRONICS]: [
        "Mobile",
        "Computer",
        "TV & Appliances",
        "Camera",
        "Audio"
    ],
    [DomainType.APPLIANCES]: [
        "Kitchen Appliances",
        "Home Appliances",
        "Personal Care Appliances"
    ],
    [DomainType.HOME_KITCHEN]: [
        "Kitchen",
        "Home Decor",
        "Furniture",
        "Storage"
    ],
    [DomainType.HEALTH_WELLNESS]: [
        "Healthcare",
        "Fitness",
        "Nutrition",
        "Personal Care"
    ],
    [DomainType.FNB]: [
        "Fast Food",
        "Beverages",
        "Desserts",
        "Indian",
        "Chinese"
    ]
};

export const getDomainCategories = (domain: string): string[] => {
    return DOMAIN_CATEGORY_MAP[domain] || [];
};

export const isDomainSupported = (domain: string): boolean => {
    return domain in DOMAIN_CATEGORY_MAP;
};