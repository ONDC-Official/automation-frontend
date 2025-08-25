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
    rank?: number; 
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
    seq?: number; 
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
        fssai_no?:string;
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
                domain: "ONDC:RET11", 
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
                                        value: "ISN"
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
                              "@ondc/org/fssai_license_no":firstStore?.fssai_no,

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
        const categoryMap = new Map<string, { 
            timing: any, 
            rank: number, 
            itemCount: number,
            isCustomMenu?: boolean,
            isRegularCategory?: boolean,
            originalName?: string,
            customMenuId?: string 
        }>();
        const customGroupsMap = new Map<string, any>();
    
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
        
      
        

        if (sellerData.menuItems && sellerData.menuItems.length > 0) {
            sellerData.menuItems.forEach((item: any, index: number) => {

                if (item.category && item.name) {
                    const customMenuId = `CM${index + 1}`;
                    if (!categoryMap.has(customMenuId)) {
                        const rank = item.rank || (categoryMap.size + 1);
                        categoryMap.set(customMenuId, {
                            timing: {
                                dayFrom: this.convertDayToNumber(item.dayFrom || "1"),
                                dayTo: this.convertDayToNumber(item.dayTo || "7"),
                                timeFrom: this.convertTimeFormat(item.timeFrom || "00:00"),
                                timeTo: this.convertTimeFormat(item.timeTo || "23:59")
                            },
                            rank: rank,
                            itemCount: 1,
                            isCustomMenu: true, // Flag to distinguish as custom_menu
                            originalName: item.name,
                            customMenuId: customMenuId
                        });
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
                                seq: group.seq || (groupIndex + 1) 
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
                    // Check if there's a matching menu item with rank for this category
                    const menuItemWithCategory = sellerData.menuItems?.find((mi: any) => mi.category === item.category);
                    const rank = menuItemWithCategory?.rank || categoryRankMap[item.category] || (categoryMap.size + 1);
                    categoryMap.set(item.category, {
                        timing: {},
                        rank: rank,
                        itemCount: 1
                    });
                } else if (item.category) {
                    // Category already exists, just increment count
                    const existing = categoryMap.get(item.category)!;
                    existing.itemCount++;
                }
            });
        }
        
        // Create category objects with proper type tags
        categoryMap.forEach((categoryData, categoryName) => {
            const { timing, rank, itemCount, isCustomMenu, isRegularCategory, originalName } = categoryData;
            const categoryTags: any[] = [];
            
            // Determine category type
            if (isCustomMenu) {
                // Custom menu categories
                categoryTags.push({
                    code: "type",
                    list: [
                        {
                            code: "type",
                            value: "custom_menu"
                        }
                    ]
                });
                
                // Add timing tags for custom menu
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
            } else if (isRegularCategory) {
                // Regular categories from item details
                categoryTags.push({
                    code: "type",
                    list: [
                        {
                            code: "type",
                            value: "category"
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
            
            const categoryObj: any = {
                id: isCustomMenu ? categoryData.customMenuId : this.generateCategoryId(),
                descriptor: {
                    name: isCustomMenu ? originalName : categoryName
                },
                tags: categoryTags
            };
            
            // Don't add price to custom_menu categories as requested
            
            categories.push(categoryObj);
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

    private calculatePriceRange(sellingPrice: number, customizationGroups: any[]): { lower: string; upper: string } {
        let minAdditionalPrice = 0;
        let maxAdditionalPrice = 0;

        if (customizationGroups && customizationGroups.length > 0) {
            customizationGroups.forEach(group => {
                const items = group.items || group.customizations || [];
                
                if (items.length > 0) {
                    const prices = items.map((item: any) => 
                        typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)
                    ).filter((price: number) => !isNaN(price)); // Filter out invalid prices
                    
                    if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        
                        // For lower bound: selling price + minimum required customizations
                        if (group.required || (group.minQuantity && group.minQuantity > 0)) {
                            const minQty = group.minQuantity || 1;
                            minAdditionalPrice += minPrice * minQty;
                        }
                        
                        // For upper bound: selling price + maximum possible customizations
                        const maxQty = group.maxQuantity || (group.type === 'single' ? 1 : prices.length);
                        maxAdditionalPrice += maxPrice * maxQty;
                    }
                }
            });
        }

        // Calculate final price range
        const lowerPrice = sellingPrice + minAdditionalPrice;
        const upperPrice = sellingPrice + maxAdditionalPrice;

        return {
            lower: lowerPrice.toFixed(2),
            upper: Math.max(lowerPrice, upperPrice).toFixed(2) // Ensure upper is always >= lower
        };
    }

    private generateFBMenuItems(sellerData: any, locationIds: string[]) {
     
        const menuItems = sellerData.menuItems || [];
        const itemDetails = sellerData.items || [];
        
        // If no item details, return default items
        if (itemDetails.length === 0) {
            return this.generateDefaultFBItems(locationIds);
        }

        // Create a map of custom menu items for ID reference
        const customMenuMap = new Map<string, string>();
        menuItems.forEach((menuItem: any, index: number) => {
            if (menuItem.name) {
                // Generate consistent ID for custom menu items
                const customMenuId = `CM${index + 1}`;
                customMenuMap.set(menuItem.name, customMenuId);
            }
        });

        const storeFulfillmentsMap = this.generateStoreFulfillmentsMap(sellerData.stores || []);
        const items: any[] = [];

        // Process itemDetails as the primary source for items array
        itemDetails.forEach((itemDetail: any, index: number) => {
                const locationId = locationIds[0] || "L_DEFAULT";
                const fulfillmentId = itemDetail?.default_fulfillment_type === "Self-Pickup" ? "F2" : "F1";
                
                // Find corresponding menu item if available (for customizations)
                const menuItem = menuItems.find((menu: any) => 
                    menu.name === itemDetail.name || 
                    menu.name.toLowerCase().includes(itemDetail.name.toLowerCase())
                );

                // Get customization groups from matching menu item
                const customizationGroups = menuItem?.customizationGroups || [];
                
                // Create item based on item details
                const item = {
                    id: `I${index + 1}`,
                    time: {
                        label: "enable",
                        timestamp: new Date().toISOString()
                    },
                    // parent_item_id: itemDetail.category || "Uncategorized",
                    descriptor: {
                        name: itemDetail.name,
                        symbol: itemDetail?.symbol || itemDetail?.images || "https://snp.com/images/food.png",
                        short_desc: itemDetail?.short_desc || itemDetail.name,
                        long_desc: itemDetail?.long_desc || itemDetail?.short_desc || itemDetail.name,
                        images: [itemDetail?.images || "https://snp.com/images/food.png"]
                    },
                quantity: {
                    unitized: {
                        measure: {
                            unit: itemDetail?.unit ||"unit",
                            value: itemDetail?.value||"1"
                        }
                    },
                    available: {
                        count: itemDetail?.available_count || "99"
                    },
                    maximum: {
                        count: itemDetail?.maximum_count || "99"
                    },
                    minimum: {
                        count: itemDetail?.minimum_count ||"1"
                    }
                },
                    price: (() => {
                        const sellingPrice = parseFloat(itemDetail?.selling_price || "100");
                        const mrpPrice = parseFloat(itemDetail?.mrp || itemDetail?.selling_price || "100");
                        
                        const priceObj: any = {
                            currency: "INR",
                            value: sellingPrice.toFixed(2),
                            maximum_value: Math.max(sellingPrice, mrpPrice).toFixed(2)
                        };
                        
                        // Add range tags if item has customizations
                        if (customizationGroups && customizationGroups.length > 0) {
                            const priceRange = this.calculatePriceRange(sellingPrice, customizationGroups);
                            priceObj.tags = [
                                {
                                    code: "range",
                                    list: [
                                        {
                                            code: "lower",
                                            value: priceRange.lower
                                        },
                                        {
                                            code: "upper",
                                            value: priceRange.upper
                                        }
                                    ]
                                }
                            ];
                        }
                        
                        return priceObj;
                    })(),
                    category_id:  "F&B",
                    category_ids: (() => {
                        const categoryIds: string[] = [];
                       
                        if (itemDetail?.menu_item && customMenuMap.has(itemDetail.menu_item)) {
                            const customMenuId = customMenuMap.get(itemDetail.menu_item);
                            const menuRank = menuItem?.rank || 1;
                            categoryIds.push(`${customMenuId}:${menuRank}`);
                        }
                        
                        return categoryIds.length > 0 ? categoryIds : ["5:1"];
                    })(),
                    fulfillment_id: itemDetail?.default_fulfillment_type === "Self-Pickup" ? "F2" : "F1",
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
                        ...(menuItem || {}),
                        veg_non_veg: menuItem?.vegNonVeg || itemDetail?.veg_non_veg,
                        customizationGroups: customizationGroups,
                        attributes: itemDetail?.attributes
                    })
                };

                items.push(item);
                
                // Generate customization items if available
                if (customizationGroups && customizationGroups.length > 0) {
                    const customizationItems = this.generateCustomizationItems(
                        {
                            ...(menuItem || {}),
                            customizations: customizationGroups
                        },
                        index,
                        locationId,
                        fulfillmentId,
                        itemDetail  // Pass itemDetail for code generation
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
        fulfillmentId: string,
        itemDetail?: any
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
                    // parent_item_id: `I${parentIndex + 1}`,
                    descriptor: {
                        name: customization.name,
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
            // parent_item_id: "Uncategorized",
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
                storeFulfillmentsMap.set(storeKey, ["F1", "F2"]);
            } else if (supportedFulfillments) {
                const fulfillmentId =  
                                    supportedFulfillments === "Delivery" ? "F1" : 
                                    supportedFulfillments === "Self-Pickup" ? "F2" : "F1";
                storeFulfillmentsMap.set(storeKey, [fulfillmentId]);
            } else {
                storeFulfillmentsMap.set(storeKey, ["F2"]); // Default to Delivery
            }
        });
        
        return storeFulfillmentsMap;
    }
}