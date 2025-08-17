import { v4 as uuidv4 } from "uuid";
import { MapCity, MapCode } from "../utils/mapCityCodes";
import { SellerService } from "./sellerService";

export interface FBMenuItem {
    id?: string;
    name: string;
    shortDescription?: string;
    longDescription?: string;
    description?: string;
    price: number | string;
    category?: string;
    category_id?: string;
    images?: string[] | string;
    veg_non_veg?: "veg" | "non-veg" | "egg";
    vegNonVeg?: "veg" | "non-veg" | "egg";
    tags?: Array<{
        code: string;
        value: string;
    }>;
    customizationGroups?: FBCustomizationGroup[];
    customizations?: FBCustomizationGroup[];
}

export interface FBCustomizationGroup {
    id: string;
    name: string;
    type: "single" | "multiple";
    required?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
    min_quantity?: number;
    max_quantity?: number;
    items?: FBCustomization[];
    customizations?: FBCustomization[];
}

export interface FBCustomization {
    id: string;
    name: string;
    price: number | string;
    description?: string;
    default?: boolean;
    veg_non_veg?: "veg" | "non-veg" | "egg";
    vegNonVeg?: "veg" | "non-veg" | "egg";
}

export interface FBSellerData {
    seller_id: string;
    seller_name: string;
    seller_description?: string;
    seller_image?: string;
    domain: "F&B";
    location?: {
        city: string;
        country: string;
    };
    stores?: Array<{
        locality: string;
        street?: string;
        city?: string;
        state?: string;
        area_code?: string;
        gps?: string;
        phone?: string;
        email?: string;
        supported_fulfillments?: string;
        supported_subcategories?: string[];
        day_from?: string;
        day_to?: string;
        time_from?: string;
        time_to?: string;
        holiday?: string[];
        serviceabilities?: Array<{
            category: string;
            type: string;
            val: string;
            unit: string;
            location?: string;
        }>;
    }>;
    menuItems?: FBMenuItem[];
    categories?: string[];
    provider_name?: string;
    short_desc?: string;
    long_desc?: string;
    images?: string;
    symbolImage?: string;
}

export class FBSellerService extends SellerService {
    
    private convertTimeFormat(time: string): string {
        if (!time) return "";
        // Remove colons from time format (HH:MM to HHMM)
        return time.replace(":", "");
    }
    
    private convertDayToNumber(day: string): string {
        const dayMap: { [key: string]: string } = {
            "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
            "monday": "1", "tuesday": "2", "wednesday": "3", "thursday": "4",
            "friday": "5", "saturday": "6", "sunday": "7",
            "mon": "1", "tue": "2", "wed": "3", "thu": "4", "fri": "5", "sat": "6", "sun": "7"
        };
        
        if (dayMap[day.toLowerCase()]) {
            return dayMap[day.toLowerCase()];
        }
        return day; // Return as-is if already a number or unknown format
    }
    
    generateFBOnSearchPayload(sellerData: FBSellerData, domainCategories?: Set<string>) {
        const timestamp = new Date().toISOString();
        const transactionId = uuidv4();
        const messageId = uuidv4();
        
        // Generate provider ID from seller data
        const providerId = `P_${Date.now()}`;
        
        // Get all stores data
        const stores = sellerData.stores || [];
        const firstStore = stores[0] || {};
        
        // Generate unique location IDs for each store
        const locationIds = stores.map((_: any, index: number) => `L_${Date.now()}_${index + 1}`);
        
        const cityCode = firstStore?.area_code ? MapCode(parseInt(firstStore.area_code)) : null;
        
        const onSearchPayload = {
            context: {
                domain: "ONDC:RET11", // F&B domain code
                country: "IND",
                city: cityCode ? `std:${cityCode}` : "std:080",
                action: "on_search",
                core_version: "1.2.5",
                bap_id: "bnp.com",
                bap_uri: "https://bnp.com/ondc",
                bpp_id: "snp.com",
                bpp_uri: "https://snp.com/ondc",
                transaction_id: transactionId,
                message_id: messageId,
                timestamp: timestamp
            },
            message: {
                catalog: {
                    "bpp/descriptor": {
                        name: sellerData?.provider_name || 'F&B Provider',
                        symbol: sellerData?.symbolImage || "https://snp.com/images/fb.png",
                        short_desc: sellerData?.short_desc || "Food & Beverage Marketplace",
                        long_desc: sellerData?.long_desc || "Food & Beverage Marketplace",
                        images: sellerData?.images ? [sellerData.images] : ["https://snp.com/images/fb.png"],
                        tags: [
                            {
                                code: "bpp_terms",
                                list: [
                                    {
                                        code: "np_type",
                                        value: "MSN"
                                    },
                                    {
                                        code: "accept_bap_terms",
                                        value: "Y"
                                    }
                                ]
                            }
                        ]
                    },
                    "bpp/providers": [
                        {
                            id: providerId,
                            time: {
                                label: "enable",
                                timestamp: timestamp
                            },
                            fulfillments: this.generateFulfillments(sellerData),
                            descriptor: {
                                name: sellerData.provider_name || "Restaurant",
                                symbol: sellerData.symbolImage || "https://snp.com/images/restaurant.png",
                                short_desc: sellerData.short_desc || sellerData.provider_name || "Restaurant",
                                long_desc: sellerData.long_desc || sellerData.short_desc || sellerData.provider_name || "Restaurant",
                                images: [
                                    sellerData.images || "https://snp.com/images/restaurant.png"
                                ]
                            },
                            ttl: "P1D",
                            locations: this.generateLocations(stores, locationIds, timestamp),
                            categories: this.generateFBCategories(sellerData),
                            items: this.generateFBMenuItems(sellerData, locationIds),
                            tags: this.generateProviderTags(sellerData, locationIds, domainCategories)
                        }
                    ]
                }
            }
        };

        return onSearchPayload;
    }

    private generateFBCategories(sellerData: any) {
        const categories: any[] = [];
        const categoryMap = new Map<string, { timing: any, rank: number, itemCount: number }>();
        const customGroupsMap = new Map<string, any>();
        
        // Define category order/ranking (can be customized)
        const categoryRankMap: { [key: string]: number } = {
            "Appetizers": 1,
            "Starters": 1,
            "Soups": 2,
            "Salads": 3,
            "Main Course": 4,
            "Mains": 4,
            "Breads": 5,
            "Rice": 6,
            "Beverages": 7,
            "Desserts": 8,
            "Drinks": 7
        };
        
        // Build a map of categories with their timing information from menu items
        if (sellerData.menuItems && sellerData.menuItems.length > 0) {
            sellerData.menuItems.forEach((item: any, index: number) => {
                // Collect regular categories
                if (item.category) {
                    if (!categoryMap.has(item.category)) {
                        // Determine rank based on predefined map or order of appearance
                        const rank = categoryRankMap[item.category] || (categoryMap.size + 1);
                        categoryMap.set(item.category, {
                            timing: {
                                dayFrom: this.convertDayToNumber(item.dayFrom || "1"),
                                dayTo: this.convertDayToNumber(item.dayTo || "7"),
                                timeFrom: this.convertTimeFormat(item.timeFrom || "00:00"),
                                timeTo: this.convertTimeFormat(item.timeTo || "23:59")
                            },
                            rank: rank,
                            itemCount: 1
                        });
                    } else {
                        // Update timing to include the widest range for the category
                        const existing = categoryMap.get(item.category)!;
                        existing.itemCount++;
                        
                        if (item.dayFrom && existing.timing.dayFrom) {
                            existing.timing.dayFrom = Math.min(parseInt(existing.timing.dayFrom), parseInt(item.dayFrom)).toString();
                        }
                        if (item.dayTo && existing.timing.dayTo) {
                            existing.timing.dayTo = Math.max(parseInt(existing.timing.dayTo), parseInt(item.dayTo)).toString();
                        }
                        if (item.timeFrom && existing.timing.timeFrom) {
                            existing.timing.timeFrom = item.timeFrom < existing.timing.timeFrom ? item.timeFrom : existing.timing.timeFrom;
                        }
                        if (item.timeTo && existing.timing.timeTo) {
                            existing.timing.timeTo = item.timeTo > existing.timing.timeTo ? item.timeTo : existing.timing.timeTo;
                        }
                    }
                }
                
                // Collect custom groups from menu items
                if (item.customizationGroups && item.customizationGroups.length > 0) {
                    item.customizationGroups.forEach((group: any, groupIndex: number) => {
                        if (!customGroupsMap.has(group.id)) {
                            customGroupsMap.set(group.id, {
                                id: group.id,
                                name: group.name,
                                type: group.type,
                                minQuantity: group.minQuantity || 0,
                                maxQuantity: group.maxQuantity || 1,
                                seq: groupIndex + 1
                            });
                        }
                    });
                }
            });
        }
        
        // Also check item details for categories (without timing)
        if (sellerData.items && sellerData.items.length > 0) {
            sellerData.items.forEach((item: any) => {
                if (item.category && !categoryMap.has(item.category)) {
                    const rank = categoryRankMap[item.category] || (categoryMap.size + 1);
                    categoryMap.set(item.category, {
                        timing: {},
                        rank: rank,
                        itemCount: 1
                    });
                }
            });
        }
        
        // Create category objects with timing tags
        categoryMap.forEach((categoryData, categoryName) => {
            const { timing, rank, itemCount } = categoryData;
            const categoryTags: any[] = [
                {
                    code: "type",
                    list: [
                        {
                            code: "type",
                            value: "custom_menu"
                        }
                    ]
                }
            ];
            
            // Add timing tags if timing information is available
            if (timing.dayFrom && timing.dayTo && timing.timeFrom && timing.timeTo) {
                categoryTags.push({
                    code: "timing",
                    list: [
                        {
                            code: "day_from",
                            value: timing.dayFrom
                        },
                        {
                            code: "day_to",
                            value: timing.dayTo
                        },
                        {
                            code: "time_from",
                            value: timing.timeFrom
                        },
                        {
                            code: "time_to",
                            value: timing.timeTo
                        }
                    ]
                });
                
            }
            
            // Always add display tag with rank
            categoryTags.push({
                code: "display",
                list: [
                    {
                        code: "rank",
                        value: rank.toString()
                    }
                ]
            });
            
            categories.push({
                id: this.generateCategoryId(),
                descriptor: {
                    name: categoryName
                },
                tags: categoryTags
            });
        });

        // Generate categories from predefined categories if provided
        if (sellerData.categories && sellerData.categories.length > 0) {
            sellerData.categories.forEach((categoryName: string) => {
                if (!categoryMap.has(categoryName)) {
                    const rank = categoryRankMap[categoryName] || (categoryMap.size + categories.length + 1);
                    categories.push({
                        id: this.generateCategoryId(),
                        descriptor: {
                            name: categoryName
                        },
                        tags: [
                            {
                                code: "type",
                                list: [
                                    {
                                        code: "type",
                                        value: "custom_menu"
                                    }
                                ]
                            },
                            {
                                code: "display",
                                list: [
                                    {
                                        code: "rank",
                                        value: rank.toString()
                                    }
                                ]
                            }
                        ]
                    });
                }
            });
        }

        // Default F&B categories if none provided
        if (categories.length === 0) {
            const defaultCategories = ["Appetizers", "Main Course", "Beverages", "Desserts"];
            defaultCategories.forEach((categoryName, index) => {
                categories.push({
                    id: this.generateCategoryId(),
                    descriptor: {
                        name: categoryName
                    },
                    tags: [
                        {
                            code: "type",
                            list: [
                                {
                                    code: "type",
                                    value: "custom_menu"
                                }
                            ]
                        }
                    ]
                });
            });
        }
        
        // Add custom groups as separate category entries
        customGroupsMap.forEach((groupData, groupId) => {
            categories.push({
                id: groupId,
                descriptor: {
                    name: groupData.name
                },
                tags: [
                    {
                        code: "type",
                        list: [
                            {
                                code: "type",
                                value: "custom_group"
                            }
                        ]
                    },
                    {
                        code: "config",
                        list: [
                            {
                                code: "min",
                                value: groupData.minQuantity.toString()
                            },
                            {
                                code: "max",
                                value: groupData.maxQuantity.toString()
                            },
                            {
                                code: "input",
                                value: groupData.type === "single" ? "select" : "multiselect"
                            },
                            {
                                code: "seq",
                                value: groupData.seq.toString()
                            }
                        ]
                    }
                ]
            });
        });

        return categories;
    }

    private generateFBMenuItems(sellerData: any, locationIds: string[]) {
        // For F&B, we should use the menuItems from the Custom Menu form
        // combined with item details from the Item Details form
        const menuItems = sellerData.menuItems || [];
        const itemDetails = sellerData.items || [];
        
        // If no menu items, try to generate from item details
        if (menuItems.length === 0 && itemDetails.length === 0) {
            return this.generateDefaultFBItems(locationIds);
        }

        const storeFulfillmentsMap = this.generateStoreFulfillmentsMap(sellerData.stores || []);
        const items: any[] = [];

        // Process menuItems if available
        if (menuItems.length > 0) {
            menuItems.forEach((menuItem: any, index: number) => {
                const locationId = locationIds[0] || "L_DEFAULT";
                const fulfillmentId = "F2"; // Default to Delivery for F&B
                
                // Find corresponding item details if available
                const itemDetail = itemDetails.find((item: any) => 
                    item.name === menuItem.name || 
                    item.name.toLowerCase().includes(menuItem.name.toLowerCase())
                );

                // Get customization groups from menu item
                const customizationGroups = menuItem.customizationGroups || [];
                
                // Create main menu item
                const item = {
                    id: `I${index + 1}`,
                    time: {
                        label: "enable",
                        timestamp: new Date().toISOString()
                    },
                    parent_item_id: menuItem.category || "Uncategorized",
                    descriptor: {
                        name: menuItem.name,
                        code: itemDetail?.code || `1:FB${String(index + 1).padStart(6, '0')}`,
                        symbol: typeof menuItem.images === 'string' ? menuItem.images : menuItem.images?.[0] || itemDetail?.symbol || "https://snp.com/images/food.png",
                        short_desc: menuItem.shortDescription || menuItem.name,
                        long_desc: menuItem.longDescription || menuItem.shortDescription || menuItem.name,
                        images: [typeof menuItem.images === 'string' ? menuItem.images : menuItem.images?.[0] || itemDetail?.images || "https://snp.com/images/food.png"]
                    },
                quantity: {
                    unitized: {
                        measure: {
                            unit: "unit",
                            value: "1"
                        }
                    },
                    available: {
                        count: "99"
                    },
                    maximum: {
                        count: "99"
                    },
                    minimum: {
                        count: "1"
                    }
                },
                    price: {
                        currency: "INR",
                        value: menuItem.price.toString() || itemDetail?.selling_price || "100",
                        maximum_value: menuItem.price.toString() || itemDetail?.mrp || itemDetail?.selling_price || "100"
                    },
                    category_id: menuItem.category || itemDetail?.category || "MENU",
                    fulfillment_id: itemDetail?.default_fulfillment_type === "Self-Pickup" ? "F3" : "F2",
                    location_id: locationId,
                    "@ondc/org/returnable": itemDetail?.returnable || false,
                    "@ondc/org/cancellable": itemDetail?.cancellable !== false,
                    "@ondc/org/return_window": itemDetail?.return_window || "PT0M",
                    "@ondc/org/seller_pickup_return": false,
                    "@ondc/org/time_to_ship": itemDetail?.time_to_ship || "PT30M",
                    "@ondc/org/available_on_cod": itemDetail?.cod_availability !== false,
                    "@ondc/org/contact_details_consumer_care": itemDetail ? 
                        `${itemDetail.consumer_care_name || "Support"},${itemDetail.consumer_care_email || "support@restaurant.com"},${itemDetail.consumer_care_contact || "18004254444"}` :
                        "Support,support@restaurant.com,18004254444",
                    tags: this.generateFBItemTags({
                        ...menuItem,
                        veg_non_veg: menuItem.vegNonVeg || itemDetail?.veg_non_veg,
                        customizationGroups: customizationGroups,
                        attributes: itemDetail?.attributes
                    })
                };

                items.push(item);
                
                // Generate customization items if available
                if (customizationGroups && customizationGroups.length > 0) {
                    const customizationItems = this.generateCustomizationItems(
                        {
                            ...menuItem,
                            customizations: customizationGroups
                        },
                        index,
                        locationId,
                        fulfillmentId
                    );
                    items.push(...customizationItems);
                }
            });
        } else {
            // If no menu items, generate from item details
            itemDetails.forEach((itemDetail: any, index: number) => {
                const locationId = locationIds[0] || "L_DEFAULT";
                const fulfillmentId = itemDetail.default_fulfillment_type === "Self-Pickup" ? "F3" : "F2";

                const item = {
                    id: `I${index + 1}`,
                    time: {
                        label: "enable",
                        timestamp: new Date().toISOString()
                    },
                    parent_item_id: itemDetail.category || "Uncategorized",
                    descriptor: {
                        name: itemDetail.name,
                        code: itemDetail.code || `1:FB${String(index + 1).padStart(6, '0')}`,
                        symbol: itemDetail.symbol || "https://snp.com/images/food.png",
                        short_desc: itemDetail.short_desc || itemDetail.name,
                        long_desc: itemDetail.long_desc || itemDetail.short_desc || itemDetail.name,
                        images: [itemDetail.images || "https://snp.com/images/food.png"]
                    },
                    quantity: {
                        unitized: {
                            measure: {
                                unit: itemDetail.unit || "unit",
                                value: itemDetail.value || "1"
                            }
                        },
                        available: {
                            count: itemDetail.available_count || "99"
                        },
                        maximum: {
                            count: itemDetail.maximum_count || "99"
                        },
                        minimum: {
                            count: itemDetail.minimum_count || "1"
                        }
                    },
                    price: {
                        currency: itemDetail.currency || "INR",
                        value: itemDetail.selling_price || "100",
                        maximum_value: itemDetail.mrp || itemDetail.selling_price || "100"
                    },
                    category_id: itemDetail.category || "MENU",
                    fulfillment_id: fulfillmentId,
                    location_id: locationId,
                    "@ondc/org/returnable": itemDetail.returnable || false,
                    "@ondc/org/cancellable": itemDetail.cancellable !== false,
                    "@ondc/org/return_window": itemDetail.return_window || "PT0M",
                    "@ondc/org/seller_pickup_return": false,
                    "@ondc/org/time_to_ship": itemDetail.time_to_ship || "PT30M",
                    "@ondc/org/available_on_cod": itemDetail.cod_availability !== false,
                    "@ondc/org/contact_details_consumer_care": 
                        `${itemDetail.consumer_care_name || "Support"},${itemDetail.consumer_care_email || "support@restaurant.com"},${itemDetail.consumer_care_contact || "18004254444"}`,
                    tags: this.generateFBItemTags({
                        veg_non_veg: itemDetail.veg_non_veg,
                        attributes: itemDetail.attributes
                    })
                };

                items.push(item);
            });
        }

        return items;
    }

    private generateCustomizationItems(
        parentItem: FBMenuItem,
        parentIndex: number,
        locationId: string,
        fulfillmentId: string
    ): any[] {
        const customizationItems: any[] = [];
        let customizationCounter = 0;

        parentItem.customizations?.forEach((group, groupIndex) => {
            // Handle both 'items' and 'customizations' array names
            const groupItems = group.items || group.customizations || [];
            groupItems.forEach((customization, custIndex) => {
                customizationCounter++;
                const customizationItem = {
                    id: `C${parentIndex + 1}_${customizationCounter}`,
                    time: {
                        label: "enable",
                        timestamp: new Date().toISOString()
                    },
                    parent_item_id: `I${parentIndex + 1}`,
                    descriptor: {
                        name: customization.name,
                        code: `1:CUST${String(parentIndex + 1).padStart(3, '0')}${String(customizationCounter).padStart(3, '0')}`,
                        short_desc: customization.description || customization.name,
                        long_desc: customization.description || customization.name,
                        images: ["https://snp.com/images/customization.png"]
                    },
                    quantity: {
                        unitized: {
                            measure: {
                                unit: "unit",
                                value: "1"
                            }
                        },
                        available: {
                            count: "99"
                        },
                        maximum: {
                            count: (group.maxQuantity || group.max_quantity || 1).toString()
                        },
                        minimum: {
                            count: (group.minQuantity || group.min_quantity || 0).toString()
                        }
                    },
                    price: {
                        currency: "INR",
                        value: (typeof customization.price === 'string' ? customization.price : customization.price.toString()),
                        maximum_value: (typeof customization.price === 'string' ? customization.price : customization.price.toString())
                    },
                    category_id: "CUSTOMIZATION",
                    fulfillment_id: fulfillmentId,
                    location_id: locationId,
                    "@ondc/org/returnable": false,
                    "@ondc/org/cancellable": true,
                    "@ondc/org/return_window": "PT0M",
                    "@ondc/org/seller_pickup_return": false,
                    "@ondc/org/time_to_ship": "PT0M",
                    "@ondc/org/available_on_cod": true,
                    "@ondc/org/contact_details_consumer_care": "Support,support@restaurant.com,18004254444",
                    tags: [
                        {
                            code: "type",
                            list: [
                                {
                                    code: "type",
                                    value: "customization"
                                }
                            ]
                        },
                        {
                            code: "parent",
                            list: [
                                {
                                    code: "id",
                                    value: group.id
                                },
                                {
                                    code: "default",
                                    value: customization.default ? "yes" : "no"
                                }
                            ]
                        },
                        // Add child tag if there's a next custom group
                        ...(parentItem.customizations && groupIndex < parentItem.customizations.length - 1 ? [{
                            code: "child",
                            list: [
                                {
                                    code: "id",
                                    value: parentItem.customizations[groupIndex + 1].id
                                }
                            ]
                        }] : []),
                        ...((customization.veg_non_veg || customization.vegNonVeg) ? [{
                            code: "veg_nonveg",
                            list: [
                                {
                                    code: (customization.veg_non_veg || customization.vegNonVeg) === "veg" ? "veg" : "non-veg",
                                    value: "yes"
                                }
                            ]
                        }] : [])
                    ]
                };

                customizationItems.push(customizationItem);
            });
        });

        return customizationItems;
    }

    private generateFBItemTags(menuItem: any): any[] {
        const tags = [];
        
        // Type tag
        tags.push({
            code: "type",
            list: [
                {
                    code: "type",
                    value: "item"
                }
            ]
        });

        // Veg/Non-veg tag
        if (menuItem.veg_non_veg) {
            tags.push({
                code: "veg_nonveg",
                list: [
                    {
                        code: menuItem.veg_non_veg === "veg" ? "veg" : "non-veg",
                        value: "yes"
                    }
                ]
            });
        }

        // Reference custom groups by ID
        const customizationGroups = menuItem.customizationGroups || menuItem.customizations || [];
        if (customizationGroups.length > 0) {
            customizationGroups.forEach((group: FBCustomizationGroup) => {
                // Add custom_group reference tag
                tags.push({
                    code: "custom_group",
                    list: [
                        {
                            code: "id",
                            value: group.id
                        }
                    ]
                });
                
                // Add config tag for this custom group
                tags.push({
                    code: "config",
                    list: [
                        {
                            code: "id",
                            value: group.id
                        },
                        {
                            code: "min",
                            value: (group.minQuantity || group.min_quantity || 0).toString()
                        },
                        {
                            code: "max",
                            value: (group.maxQuantity || group.max_quantity || 1).toString()
                        },
                        {
                            code: "seq",
                            value: group.id.replace(/[^0-9]/g, '') || "1"
                        }
                    ]
                });
            });
        }

        
        // Add F&B specific attributes if available
        if (menuItem.attributes) {
            // Cuisine tag
            if (menuItem.attributes.cuisine) {
                tags.push({
                    code: "cuisine",
                    list: [
                        {
                            code: "cuisine",
                            value: menuItem.attributes.cuisine
                        }
                    ]
                });
            }
            
            // Course tag
            if (menuItem.attributes.course) {
                tags.push({
                    code: "course",
                    list: [
                        {
                            code: "course",
                            value: menuItem.attributes.course
                        }
                    ]
                });
            }
            
            // Allergen info tag
            if (menuItem.attributes.allergen_info) {
                tags.push({
                    code: "allergen_info",
                    list: [
                        {
                            code: "allergen_info",
                            value: menuItem.attributes.allergen_info
                        }
                    ]
                });
            }
            
            // Nutritional info tag
            if (menuItem.attributes.nutritional_info) {
                tags.push({
                    code: "nutritional_info",
                    list: [
                        {
                            code: "nutritional_info",
                            value: menuItem.attributes.nutritional_info
                        }
                    ]
                });
            }
        }

        return tags;
    }

    private generateDefaultFBItems(locationIds: string[]): any[] {
        const defaultLocationId = locationIds[0] || "L_DEFAULT";
        
        return [{
            id: "I1",
            time: {
                label: "enable",
                timestamp: new Date().toISOString()
            },
            parent_item_id: "Uncategorized",
            descriptor: {
                name: "Sample Food Item",
                code: "1:FB000001",
                symbol: "https://snp.com/images/food.png",
                short_desc: "Sample Food Item",
                long_desc: "Sample Food Item",
                images: ["https://snp.com/images/food.png"]
            },
            quantity: {
                unitized: {
                    measure: {
                        unit: "unit",
                        value: "1"
                    }
                },
                available: {
                    count: "99"
                },
                maximum: {
                    count: "99"
                },
                minimum: {
                    count: "1"
                }
            },
            price: {
                currency: "INR",
                value: "150.00",
                maximum_value: "150.00"
            },
            category_id: "MENU",
            fulfillment_id: "F2",
            location_id: defaultLocationId,
            "@ondc/org/returnable": false,
            "@ondc/org/cancellable": true,
            "@ondc/org/return_window": "PT0M",
            "@ondc/org/seller_pickup_return": false,
            "@ondc/org/time_to_ship": "PT30M",
            "@ondc/org/available_on_cod": true,
            "@ondc/org/contact_details_consumer_care": "Support,support@restaurant.com,18004254444",
            tags: [
                {
                    code: "origin",
                    list: [
                        {
                            code: "country",
                            value: "IND"
                        }
                    ]
                },
                {
                    code: "veg_nonveg",
                    list: [
                        {
                            code: "veg",
                            value: "yes"
                        }
                    ]
                },
                {
                    code: "type",
                    list: [
                        {
                            code: "type",
                            value: "item"
                        }
                    ]
                }
            ]
        }];
    }

    private generateStoreFulfillmentsMap(stores: any[]): Map<string, string[]> {
        const storeFulfillmentsMap = new Map<string, string[]>();
        
        stores.forEach((store: any) => {
            const storeKey = store.locality || store.street || 'default';
            const supportedFulfillments = store.supported_fulfillments;
            
            if (supportedFulfillments === "All") {
                storeFulfillmentsMap.set(storeKey, ["F1", "F2", "F3"]);
            } else if (supportedFulfillments) {
                const fulfillmentId = supportedFulfillments === "Order" ? "F1" : 
                                    supportedFulfillments === "Delivery" ? "F2" : 
                                    supportedFulfillments === "Self-Pickup" ? "F3" : "F2";
                storeFulfillmentsMap.set(storeKey, [fulfillmentId]);
            } else {
                storeFulfillmentsMap.set(storeKey, ["F2"]); // Default to Delivery
            }
        });
        
        return storeFulfillmentsMap;
    }
}