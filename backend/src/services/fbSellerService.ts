import { v4 as uuidv4 } from "uuid";
import { MapCity, MapCode } from "../utils/mapCityCodes";
import { SellerService } from "./sellerService";

export interface FBMenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    images?: string[];
    veg_non_veg?: "veg" | "non-veg";
    tags?: Array<{
        code: string;
        value: string;
    }>;
    customizations?: FBCustomizationGroup[];
}

export interface FBCustomizationGroup {
    id: string;
    name: string;
    type: "single" | "multiple";
    required?: boolean;
    min_quantity?: number;
    max_quantity?: number;
    customizations: FBCustomization[];
}

export interface FBCustomization {
    id: string;
    name: string;
    price: number;
    description?: string;
    default?: boolean;
    veg_non_veg?: "veg" | "non-veg";
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

    private generateFBCategories(sellerData: FBSellerData) {
        const categories: any[] = [];
        
        // Generate categories from menu items if available
        if (sellerData.menuItems && sellerData.menuItems.length > 0) {
            const categorySet = new Set<string>();
            
            sellerData.menuItems.forEach(item => {
                if (item.category_id) {
                    categorySet.add(item.category_id);
                }
            });
            
            categorySet.forEach((categoryName, index) => {
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

        // Generate categories from predefined categories if provided
        if (sellerData.categories && sellerData.categories.length > 0) {
            sellerData.categories.forEach(categoryName => {
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

        return categories;
    }

    private generateFBMenuItems(sellerData: FBSellerData, locationIds: string[]) {
        if (!sellerData.menuItems || sellerData.menuItems.length === 0) {
            return this.generateDefaultFBItems(locationIds);
        }

        const storeFulfillmentsMap = this.generateStoreFulfillmentsMap(sellerData.stores || []);
        const items: any[] = [];

        sellerData.menuItems.forEach((menuItem, index) => {
            const locationId = locationIds[0] || "L_DEFAULT";
            const fulfillmentId = "F2"; // Default to Delivery for F&B

            // Create main menu item
            const item = {
                id: `I${index + 1}`,
                time: {
                    label: "enable",
                    timestamp: new Date().toISOString()
                },
                parent_item_id: menuItem.category_id || "MENU",
                descriptor: {
                    name: menuItem.name,
                    code: `1:FB${String(index + 1).padStart(6, '0')}`,
                    symbol: menuItem.images?.[0] || "https://snp.com/images/food.png",
                    short_desc: menuItem.description || menuItem.name,
                    long_desc: menuItem.description || menuItem.name,
                    images: menuItem.images || ["https://snp.com/images/food.png"]
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
                    value: menuItem.price.toString(),
                    maximum_value: menuItem.price.toString()
                },
                category_id: menuItem.category_id || "MENU",
                fulfillment_id: fulfillmentId,
                location_id: locationId,
                "@ondc/org/returnable": false, // F&B items typically not returnable
                "@ondc/org/cancellable": true,
                "@ondc/org/return_window": "PT0M", // No return window for F&B
                "@ondc/org/seller_pickup_return": false,
                "@ondc/org/time_to_ship": "PT30M", // 30 minutes typical for F&B
                "@ondc/org/available_on_cod": true,
                "@ondc/org/contact_details_consumer_care": "Support,support@restaurant.com,18004254444",
                tags: this.generateFBItemTags(menuItem)
            };

            items.push(item);

            // Generate customization items if available
            if (menuItem.customizations && menuItem.customizations.length > 0) {
                const customizationItems = this.generateCustomizationItems(
                    menuItem,
                    index,
                    locationId,
                    fulfillmentId
                );
                items.push(...customizationItems);
            }
        });

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
            group.customizations.forEach((customization, custIndex) => {
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
                            count: group.max_quantity?.toString() || "1"
                        },
                        minimum: {
                            count: group.min_quantity?.toString() || "0"
                        }
                    },
                    price: {
                        currency: "INR",
                        value: customization.price.toString(),
                        maximum_value: customization.price.toString()
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
                                    value: `I${parentIndex + 1}`
                                }
                            ]
                        },
                        {
                            code: "config",
                            list: [
                                {
                                    code: "min",
                                    value: group.min_quantity?.toString() || "0"
                                },
                                {
                                    code: "max",
                                    value: group.max_quantity?.toString() || "1"
                                },
                                {
                                    code: "input",
                                    value: group.type || "single"
                                },
                                {
                                    code: "seq",
                                    value: (groupIndex + 1).toString()
                                }
                            ]
                        },
                        ...(customization.veg_non_veg ? [{
                            code: "veg_nonveg",
                            list: [
                                {
                                    code: customization.veg_non_veg === "veg" ? "veg" : "non-veg",
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

    private generateFBItemTags(menuItem: FBMenuItem): any[] {
        const tags = [];

        // Origin tag
        tags.push({
            code: "origin",
            list: [
                {
                    code: "country",
                    value: "IND"
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

        // Customization group tags
        if (menuItem.customizations && menuItem.customizations.length > 0) {
            menuItem.customizations.forEach((group, index) => {
                tags.push({
                    code: "custom_group",
                    list: [
                        {
                            code: "id",
                            value: group.id
                        },
                        {
                            code: "name",
                            value: group.name
                        },
                        {
                            code: "type",
                            value: group.type
                        },
                        {
                            code: "min",
                            value: group.min_quantity?.toString() || "0"
                        },
                        {
                            code: "max",
                            value: group.max_quantity?.toString() || "1"
                        },
                        {
                            code: "seq",
                            value: (index + 1).toString()
                        }
                    ]
                });
            });
        }

        // Additional F&B specific tags
        tags.push({
            code: "type",
            list: [
                {
                    code: "type",
                    value: "item"
                }
            ]
        });

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
            parent_item_id: "MENU",
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