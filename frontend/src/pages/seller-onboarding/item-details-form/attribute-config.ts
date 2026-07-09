import { categoryProtocolMappings } from "@constants/common";
import { fashion } from "@constants/fashion";
import { BPCJSON } from "@constants/bcp";
import { electronicsData } from "@constants/electronics";
import { health } from "@constants/health";
import { homeJSON } from "@constants/home";
import { applianceData } from "@constants/appliances";
import { getFnBAttributes } from "@constants/fnb";
import { domainCategories } from "@constants/categories";
import type { AttributeConfig } from "@pages/seller-onboarding/item-details-form/types";

export function getProtocolKeysByCategory(category: string): string[] {
    const mapping = categoryProtocolMappings.find(
        (item) => item.category.toLowerCase() === category.toLowerCase()
    );

    return mapping?.protocolKeys || [];
}

/** Categories available for a given domain. */
export function getCategoriesByDomain(domain: string): string[] {
    const domainConfig = domainCategories.find((item) => item.domain === domain);
    return domainConfig?.categories || [];
}

/** Attribute configuration for a domain + subcategory, sourced from the per-domain constant sets. */
export const getCategoryConfig = (domain: string, subcategory: string) => {
    // For Fashion domain, use the detailed fashion configuration
    if (domain === "Fashion" && fashion[subcategory as keyof typeof fashion]) {
        return fashion[subcategory as keyof typeof fashion];
    }

    // For BPC domain
    if (domain === "BPC" && BPCJSON[subcategory as keyof typeof BPCJSON]) {
        return BPCJSON[subcategory as keyof typeof BPCJSON];
    }

    // For Electronics domain
    if (domain === "Electronics" && electronicsData[subcategory as keyof typeof electronicsData]) {
        return electronicsData[subcategory as keyof typeof electronicsData];
    }

    // For Health & Wellness domain
    if (domain === "Health & Wellness" && health[subcategory as keyof typeof health]) {
        return health[subcategory as keyof typeof health];
    }

    // For Home & Kitchen domain
    if (domain === "Home & Kitchen" && homeJSON[subcategory as keyof typeof homeJSON]) {
        return homeJSON[subcategory as keyof typeof homeJSON];
    }

    // For Appliances domain
    if (domain === "Appliances" && applianceData[subcategory as keyof typeof applianceData]) {
        return applianceData[subcategory as keyof typeof applianceData];
    }

    // For F&B domain
    if (domain === "F&B") {
        const fnbConfig = getFnBAttributes(subcategory);
        return {
            ...fnbConfig.mandatory,
            ...fnbConfig.optional,
        };
    }

    // Default configuration for other domains
    return {
        brand: {
            mandatory: false,
            value: [],
        },
    };
};

/** Mandatory-only attributes for a subcategory. */
export const getMandatoryAttributes = (domain: string, subcategory: string) => {
    const categoryConfig = getCategoryConfig(domain, subcategory);

    if (!categoryConfig || Object.keys(categoryConfig).length === 0) {
        return {};
    }

    const mandatoryOnly = Object.fromEntries(
        Object.entries(categoryConfig).filter(
            ([_, config]) => (config as AttributeConfig).mandatory === true
        )
    );
    return mandatoryOnly;
};

/** Optional-only attributes for a subcategory. */
export const getOptionalAttributes = (domain: string, subcategory: string) => {
    const categoryConfig = getCategoryConfig(domain, subcategory);
    if (!categoryConfig || Object.keys(categoryConfig).length === 0) {
        return {};
    }

    const optionalOnly = Object.fromEntries(
        Object.entries(categoryConfig).filter(
            ([_, config]) => (config as AttributeConfig).mandatory === false
        )
    );
    return optionalOnly;
};

/** Predefined (enum) values for an attribute within a domain/category, if any. */
export const getAttributePredefinedValues = (
    domain: string,
    category: string,
    attributeName: string
): string[] => {
    try {
        const categoryConfig = getCategoryConfig(domain, category);
        if (!categoryConfig || typeof categoryConfig !== "object") {
            return [];
        }

        const attributeConfig = categoryConfig[attributeName as keyof typeof categoryConfig];
        if (!attributeConfig || typeof attributeConfig !== "object") {
            return [];
        }

        // Type guard to check if attributeConfig has a 'value' property
        const config = attributeConfig as {
            value?: unknown;
            mandatory?: boolean;
        };

        if (Array.isArray(config.value) && config.value.length > 0) {
            // Ensure all values are strings
            return config.value.filter((val) => typeof val === "string") as string[];
        }

        return [];
    } catch (error) {
        console.warn(
            `Error getting predefined values for ${domain}/${category}/${attributeName}:`,
            error
        );
        return [];
    }
};

/** Smart, unit-aware placeholder text for a dynamic attribute input. */
export const getAttributePlaceholder = (attributeName: string): string => {
    const attrLower = attributeName.toLowerCase();

    // Weight related attributes
    if (
        attrLower.includes("weight") ||
        attrLower === "net_weight" ||
        attrLower === "gross_weight"
    ) {
        return `Enter ${attributeName.replace(/_/g, " ")} in grams (e.g., 500)`;
    }

    // Dimension related attributes
    if (
        attrLower.includes("height") ||
        attrLower.includes("width") ||
        attrLower.includes("breadth") ||
        attrLower.includes("length") ||
        attrLower.includes("depth") ||
        attrLower.includes("thickness")
    ) {
        return `Enter ${attributeName.replace(/_/g, " ")} in cm (e.g., 25)`;
    }

    // Size/dimensions combined
    if (attrLower === "dimensions" || attrLower === "size_dimensions") {
        return "Enter dimensions in cm (L x W x H, e.g., 30 x 20 x 10)";
    }

    // Volume/Capacity
    if (attrLower.includes("capacity") || attrLower.includes("volume")) {
        return `Enter ${attributeName.replace(/_/g, " ")} in liters or ml (e.g., 1.5L or 500ml)`;
    }

    // Power/Energy
    if (attrLower.includes("power") || attrLower.includes("wattage")) {
        return `Enter ${attributeName.replace(/_/g, " ")} in watts (e.g., 1500)`;
    }

    // Screen size
    if (attrLower === "screen_size" || attrLower === "display_size") {
        return "Enter screen size in inches (e.g., 15.6)";
    }

    // Storage/Memory
    if (attrLower === "storage" || attrLower === "memory" || attrLower === "ram") {
        return `Enter ${attributeName.replace(/_/g, " ")} (e.g., 8GB, 256GB, 1TB)`;
    }

    // Battery
    if (attrLower.includes("battery")) {
        return "Enter battery capacity in mAh (e.g., 5000)";
    }

    // Price/Cost
    if (attrLower.includes("price") || attrLower.includes("cost") || attrLower === "mrp") {
        return `Enter ${attributeName.replace(/_/g, " ")} in INR (e.g., 999)`;
    }

    // Quantity
    if (attrLower === "net_quantity" || attrLower === "quantity") {
        return "Enter quantity with unit (e.g., 500g, 1kg, 2L, 10 pieces)";
    }

    // Warranty
    if (attrLower.includes("warranty")) {
        return "Enter warranty period (e.g., 1 year, 6 months)";
    }

    // Expiry/Shelf life
    if (attrLower.includes("expiry") || attrLower.includes("shelf_life")) {
        return "Enter date in DD/MM/YYYY format or duration (e.g., 6 months)";
    }

    // Color specific
    if (attrLower === "colour" || attrLower === "color") {
        return "Please add hexadecimal color code (e.g., #FF5733)";
    }

    // Material
    if (attrLower === "material" || attrLower === "fabric") {
        return `Enter ${attributeName.replace(/_/g, " ")} (e.g., Cotton, Polyester, Steel)`;
    }

    // Size (clothing/shoes)
    if (attrLower === "size" && !attrLower.includes("screen")) {
        return "Enter size (e.g., S, M, L, XL, 42, 8)";
    }

    // Model/SKU
    if (attrLower === "model" || attrLower === "model_number" || attrLower === "sku") {
        return `Enter ${attributeName.replace(/_/g, " ")} (e.g., ABC-123-XYZ)`;
    }

    // Ingredients
    if (attrLower === "ingredients" || attrLower === "composition") {
        return "Enter ingredients/composition separated by commas";
    }

    // Nutritional
    if (
        attrLower.includes("calories") ||
        attrLower.includes("protein") ||
        attrLower.includes("carbs")
    ) {
        return `Enter ${attributeName.replace(/_/g, " ")} per 100g/100ml`;
    }

    // Temperature
    if (attrLower.includes("temperature") || attrLower === "temp") {
        return "Enter temperature in °C (e.g., 25)";
    }

    // Speed/Frequency
    if (attrLower.includes("speed") || attrLower === "rpm") {
        return "Enter speed in RPM or km/h";
    }

    // Voltage
    if (attrLower.includes("voltage")) {
        return "Enter voltage in V (e.g., 220V)";
    }

    // Resolution
    if (attrLower.includes("resolution")) {
        return "Enter resolution (e.g., 1920x1080, 4K, Full HD)";
    }

    // Connectivity
    if (attrLower.includes("connectivity") || attrLower === "interface") {
        return "Enter connectivity type (e.g., WiFi, Bluetooth, USB-C)";
    }

    // Age
    if (attrLower.includes("age_group") || attrLower === "age") {
        return "Enter age group (e.g., 3-5 years, Adult, Kids)";
    }

    // Gender
    if (attrLower === "gender") {
        return "Enter gender (e.g., Male, Female, Unisex)";
    }

    // Country
    if (attrLower === "country_of_origin" || attrLower === "origin") {
        return "Enter country code or name (e.g., IND, India)";
    }

    // Dosage
    if (attrLower.includes("dosage")) {
        return "Enter dosage (e.g., 500mg, 2 tablets daily)";
    }

    // Percentage
    if (attrLower.includes("percentage") || attrLower.includes("purity")) {
        return `Enter ${attributeName.replace(/_/g, " ")} in % (e.g., 99.9)`;
    }

    // Default
    return `Enter ${attributeName.replace(/_/g, " ")}`;
};
