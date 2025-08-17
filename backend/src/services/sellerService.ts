import { v4 as uuidv4 } from "uuid";
import { MapCity, MapCode } from "../utils/mapCityCodes";

export interface SellerData {
    seller_id: string;
    seller_name: string;
    seller_description?: string;
    seller_image?: string;
    domain?: string;
    location?: {
        city: string;
        country: string;
    };
    categories?: Array<{
        id: string;
        name: string;
        code: string;
    }>;
    items?: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        category_id?: string;
        images?: string[];
        tags?: Array<{
            code: string;
            value: string;
        }>;
    }>;
    fulfillments?: Array<{
        id: string;
        type: string;
        contact?: {
            phone: string;
            email: string;
        };
        location?: {
            gps: string;
            address: string;
        };
    }>;
    payments?: Array<{
        collected_by: string;
        type: string;
    }>;
    time_range?: {
        start: string;
        end: string;
    };
}

export class SellerService {
    private getDomainCode(domain: string | string[]): string {
        const domainMap: { [key: string]: string } = {
            "Grocery": "ONDC:RET10",
            "F&B": "ONDC:RET11",
            "Fashion": "ONDC:RET12",
            "BPC": "ONDC:RET13",
            "Electronics": "ONDC:RET14",
            "Appliances": "ONDC:RET15",
            "Home & Kitchen": "ONDC:RET16",
            "Health & Wellness": "ONDC:RET18"
        };

        if (Array.isArray(domain)) {
            // Return the first valid domain code found
            for (const d of domain) {
                if (domainMap[d]) {
                    return domainMap[d];
                }
            }
        } else if (typeof domain === 'string' && domainMap[domain]) {
            return domainMap[domain];
        }

        // Default to Grocery if no valid domain found
        return "ONDC:RET10";
    }

    generateOnSearchPayload(sellerData: any, domainCategories?: Set<string>) {
        const timestamp = new Date().toISOString();
        const transactionId = uuidv4();
        const messageId = uuidv4();

        // Generate provider ID from seller data
        const providerId = `P_${Date.now()}`;
        // Get all stores data
        const stores = sellerData.stores || [];
        const firstStore = stores[0] || {};
        
        // Generate unique location IDs for each store
        const locationIds = stores.map((store: any, index: number) => {
            const locationId = `L_${Date.now()}_${index + 1}`;
            return locationId;
        });
        const cityCode = MapCode(firstStore?.areaCode)
        const onSearchPayload = {
            context: {
                domain: this.getDomainCode(sellerData.domain),
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
                        name: sellerData?.provider_name || 'SellerNp',
                        symbol: sellerData?.symbolImage || "https://snp.com/images/np.png",
                        short_desc:  sellerData?.short_desc || "Seller Marketplace",
                        long_desc: sellerData?.long_desc || "Seller Marketplace",
                        images: sellerData?.images ? [sellerData.images] : [ "https://snp.com/images/np.png"], 
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
                        (() => {
                            // Generate categories and check if there are any
                            const categoriesResult = this.generateCategories(sellerData);
                            // Store the mapping for use in generateItems
                            (this as any)._itemToVariantGroupMap = categoriesResult.itemToVariantGroupMap;
                            
                            // Log category generation status
                            // Build provider object conditionally
                            const provider: any = {
                                id: providerId,
                                time: {
                                    label: "enable",
                                    timestamp: timestamp
                                },
                                // rating: "4",
                                fulfillments: this.generateFulfillments(sellerData),
                                descriptor: {
                                    name: sellerData.provider_name || "Store 1",
                                    symbol: sellerData.symbolImage || "https://snp.com/images/store1.png",
                                    short_desc: sellerData.short_desc || sellerData.provider_name || "Store 1",
                                    long_desc: sellerData.long_desc || sellerData.short_desc || sellerData.provider_name || "Store 1",
                                    images: [
                                        sellerData.images || "https://snp.com/images/store1.png"
                                    ]
                                },
                                ttl: "P1D",
                                locations: this.generateLocations(stores, locationIds, timestamp),
                                // Only include categories if there are any (i.e., variants exist)
                                ...(categoriesResult.categories.length > 0 && { categories: categoriesResult.categories }),
                                items: this.generateItems(sellerData, locationIds),
                                tags: this.generateProviderTags(sellerData, locationIds, domainCategories)
                            };
                            
                            return provider;
                        })()
                    ]
                }
            }
        };

        return onSearchPayload;
    }
    
    protected generateLocations(stores: any[], locationIds: string[], timestamp: string) {
        // If no stores, provide a default location
        if (!stores || stores.length === 0) {
            return [{
                id: "L_DEFAULT",
                time: {
                    label: "enable",
                    timestamp: timestamp,
                    schedule: {
                        holidays: []
                    }
                },
                gps: "12.9675,77.7496",
                address: {
                    locality: "Jayanagar",
                    street: "Jayanagar 4th Block",
                    city: "Bengaluru",
                    area_code: "560076",
                    state: "KA"
                }
            }];
        }
        
        // Map each store to a location
        return stores.map((store, index) => ({
            id: locationIds[index],
            time: {
                label: "enable",
                timestamp: timestamp,
                schedule: {
                    holidays: store.holiday ? (Array.isArray(store.holiday) ? store.holiday : [store.holiday]) : []
                }
            },
            gps: store.gps || "12.9675,77.7496",
            address: {
                locality: store.locality || "Jayanagar",
                street: store.street || "Jayanagar 4th Block",
                city: store.city || "Bengaluru",
                area_code: store.areaCode || "560076",
                state: store.state || "KA"
            }
        }));
    }

    protected generateCategoryId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 5);
        const id = `V${timestamp}${random}`.toUpperCase().substring(0, 12);
        return this.ensureCategoryIdFormat(id);
    }

    private ensureCategoryIdFormat(categoryId: string): string {
        // Check if category ID is valid (alphanumeric and max 12 chars)
        if (!categoryId || categoryId.length > 12 || !/^[A-Z0-9]+$/i.test(categoryId)) {
            return this.generateCategoryId();
        }
        return categoryId.toUpperCase().substring(0, 12);
    }

    private generateCategories(sellerData: any): { categories: any[], itemToVariantGroupMap: Map<number, string> } {
        const categories: any[] = [];
        const variantGroupMap = new Map<string, any>();
        const itemToVariantGroupMap = new Map<number, string>();
        
        // Process items to identify variant groups
        if (sellerData.items && sellerData.items.length > 0) {
            sellerData.items.forEach((item: any, parentIndex: number) => {
                const parentItemId = `I${parentIndex + 1}`;
                
                // Check if item has variants
                if (item.variants && item.variants.length > 0) {
                    // Identify variant attributes from the first variant
                    const firstVariant = item.variants[0];
                    const variantAttributes: string[] = [];
                    
                    // Check for variant-specific attributes
                    if (firstVariant.variantCombination) {
                        Object.keys(firstVariant.variantCombination).forEach(attrKey => {
                            variantAttributes.push(attrKey);
                        });
                    }
                    
                    // Create a variant group for this parent item
                    const variantGroupId = this.generateCategoryId();
                    itemToVariantGroupMap.set(parentIndex, variantGroupId);
                    const variantGroup = {
                        id: variantGroupId,
                        descriptor: {
                            name: item.category || item.name || `Variant Group ${parentIndex + 1}`
                        },
                        tags: [
                            {
                                code: "type",
                                list: [
                                    {
                                        code: "type",
                                        value: "variant_group"
                                    }
                                ]
                            },
                            {
                                code: "attr",
                                list: variantAttributes.length > 0 
                                    ? variantAttributes.map((attr, idx) => [
                                        {
                                            code: "name",
                                            value: `item.attributes.${attr}`
                                        },
                                        {
                                            code: "seq",
                                            value: (idx + 1).toString()
                                        }
                                    ]).flat()
                                    : [
                                        {
                                            code: "name",
                                            value: "item.quantity.unitized.measure"
                                        },
                                        {
                                            code: "seq",
                                            value: "1"
                                        }
                                    ]
                            }
                        ]
                    };
                    
                    variantGroupMap.set(parentItemId, variantGroup);
                } else {
                    // For items without variants, don't create a category
                    // Just set a placeholder ID for the item mapping
                    const placeholderId = `ITEM_${parentIndex + 1}`;
                    itemToVariantGroupMap.set(parentIndex, placeholderId);
                    // No category is added to the categories array
                }
            });
            
            // Add all variant groups to categories
            variantGroupMap.forEach(variantGroup => {
                categories.push(variantGroup);
            });
        }
        
        // If no categories were created, generate defaults from product categories
        // if (categories.length === 0) {
        //     const firstStore = sellerData.stores?.[0] || {};
        //     const productCategories = firstStore.supported_subcategories || sellerData.productCategories || [];
            
        //     if (productCategories.length > 0) {
        //         const defaultCategories = productCategories.map((category: string, index: number) => ({
        //             id: this.generateCategoryId(),
        //             descriptor: {
        //                 name: category
        //             },
        //             tags: [
        //                 {
        //                     code: "type",
        //                     list: [
        //                         {
        //                             code: "type",
        //                             value: "variant_group"
        //                         }
        //                     ]
        //                 },
        //                 {
        //                     code: "attr",
        //                     list: [
        //                         {
        //                             code: "name",
        //                             value: "item.quantity.unitized.measure"
        //                         },
        //                         {
        //                             code: "seq",
        //                             value: (index + 1).toString()
        //                         }
        //                     ]
        //                 }
        //             ]
        //         }));
        //         return { categories: defaultCategories, itemToVariantGroupMap };
        //     }
        // }
        
        return { categories, itemToVariantGroupMap };
    }

    protected generateFulfillments(sellerData: any) {
        const fulfillmentsMap = new Map<string, any>();
        const stores = sellerData.stores || [];
        
        // Collect all unique fulfillment types from all stores
        stores.forEach((store: any) => {
            const supportedFulfillments = store.supported_fulfillments;
            
            if (supportedFulfillments === "All") {
                // If "All" is selected, add all fulfillment types
                ["Order", "Delivery", "Self-Pickup"].forEach((type) => {
                    if (!fulfillmentsMap.has(type)) {
                        fulfillmentsMap.set(type, {
                            id: `F${fulfillmentsMap.size + 1}`,
                            type: type,
                            contact: {
                                phone: store.phone || '9988776655',
                                email:store.email || 'abc@gmail.com',
                            }
                        });
                    }
                });
            } else if (supportedFulfillments) {
                // Add the specific fulfillment type if not already added
                if (!fulfillmentsMap.has(supportedFulfillments)) {
                    fulfillmentsMap.set(supportedFulfillments, {
                        id: `F${fulfillmentsMap.size + 1}`,
                        type: supportedFulfillments,
                        contact: {
                            phone: store.phone || '9988776655',
                                email:store.email || 'abc@gmail.com',
                        }
                    });
                }
            }
        });
        
        // If no fulfillments found, default to Delivery
        if (fulfillmentsMap.size === 0) {
            fulfillmentsMap.set("Delivery", {
                id: "F1",
                type: "Delivery",
                contact: {
                    phone: "9886098860",
                    email: "example@xyz.com"
                }
            });
        }
        
        // Convert map to array
        return Array.from(fulfillmentsMap.values());
    }

    private createItemObject(
        item: any, 
        itemId: number, 
        parentItemId: string,
        storeFulfillmentsMap: Map<string, string[]>,
        stores: any[],
        locationIds: string[],
        sellerData: any,
        isVariant: boolean = false,
        parentItem?: any
    ) {
        // Find the store fulfillments for this item
        const itemStore = item.store || 'default';
        const storeFulfillmentIds = storeFulfillmentsMap.get(itemStore) || ["F2"];
        const primaryFulfillmentId = storeFulfillmentIds[0]; // Use the first available fulfillment
        
        // Find which store index this item belongs to for location mapping
        let storeIndex = 0;
        if (item.store && stores.length > 0) {
            // Try to find the store by matching locality or street
            const foundIndex = stores.findIndex((store: any) => 
                store.locality === item.store || 
                store.street === item.store ||
                store.city === item.store
            );
            if (foundIndex !== -1) {
                storeIndex = foundIndex;
            }
        }
        const locationId = locationIds[storeIndex] || locationIds[0] || "L_DEFAULT";
        
        // Generate unique code for variants
        let codeValue = item.code_value;
        if (isVariant && parentItem) {
            // Generate unique code for variant by appending variant ID
            codeValue = `${parentItem.code_value || '1:XXXXXXXXXXXXX'}`;
            // codeValue = `${parentItem.code_value || 'BASE'}-${item.variantId || itemId}`;
        }
        
        const itemObject: any = {
            id: `I${itemId}`,
            time: {
                label: "enable",
                timestamp: new Date().toISOString()
            },
            rating: "4",
            descriptor: {
                name: item.name || "Unknown Item",
                code:  (() => {
                    const codeTypeMap: { [key: string]: string } = {
                        'EAN': '1',
                        'ISBN': '2',
                        'GTIN': '3',
                        'HSN': '4',
                        'Others': '5'
                    };
                    const codeNumber = codeTypeMap[item.code_type || parentItem?.code_type] || '1';
                    return `${codeNumber}:${codeValue || 'XXXXXXXXXXXXX'}`;
                })() || '1:XXXXXXXXXXXXX',
                symbol: item.symbol || item.images || "https://snp.com/images/i1.png",
                short_desc: item.short_desc || item.name || "Unknown Item",
                long_desc: item.long_desc || item.short_desc || item.name || "Unknown Item",
                images: [
                    item.images || item.symbol || "https://snp.com/images/i1.png"
                ]
            },
            quantity: {
                unitized: {
                    measure: {
                        unit: item.unit || "gram",
                        value: item.value || "1"
                    }
                },
                available: {
                    count: item.available_count || "99"
                },
                maximum: {
                    count: item.maximum_count || "99"
                },
                minimum: {
                    count: item.minimum_count || "1"
                }
            },
            price: {
                currency: item.currency || "INR",
                value: item.selling_price || "0.00",
                maximum_value: item.mrp || item.selling_price || "0.00"
            },
            category_id: item.category || sellerData.productCategories?.[0] || "General",
            fulfillment_id: primaryFulfillmentId,
            location_id: locationId,
            "@ondc/org/returnable": item.returnable !== undefined ? item.returnable : true,
            "@ondc/org/cancellable": item.cancellable !== undefined ? item.cancellable : true,
            "@ondc/org/return_window": item.return_window || "PT1H",
            "@ondc/org/seller_pickup_return": true,
            "@ondc/org/time_to_ship": item.time_to_ship || "PT45M",
            "@ondc/org/available_on_cod": item.cod_availability !== undefined ? item.cod_availability : false,
            "@ondc/org/contact_details_consumer_care": `${item.consumer_care_name || 'Support'},${item.consumer_care_email || 'support@store.com'},${item.consumer_care_contact || '18004254444'}`,
            tags: this.getItemTags(item, sellerData.domain)
        };
        
        // Only add parent_item_id if it's a valid category ID (starts with V for variant groups)
        // Don't add it for placeholder IDs (starts with ITEM_)
        if (parentItemId && parentItemId.startsWith('V')) {
            itemObject.parent_item_id = parentItemId;
        }
        
        return itemObject;
    }

    private generateItems(sellerData: any, locationIds: string[]) {
        // Generate a map of store fulfillments for easy lookup
        const storeFulfillmentsMap = new Map<string, string[]>();
        const stores = sellerData.stores || [];
        
        stores.forEach((store: any) => {
            const storeKey = store.locality || store.street || 'default';
            const supportedFulfillments = store.supported_fulfillments;
            
            if (supportedFulfillments === "All") {
                storeFulfillmentsMap.set(storeKey, ["F1", "F2", "F3"]); // Assuming F1=Order, F2=Delivery, F3=Self-Pickup
            } else if (supportedFulfillments) {
                // Map fulfillment type to ID
                const fulfillmentId = supportedFulfillments === "Order" ? "F1" : 
                                    supportedFulfillments === "Delivery" ? "F2" : 
                                    supportedFulfillments === "Self-Pickup" ? "F3" : "F2";
                storeFulfillmentsMap.set(storeKey, [fulfillmentId]);
            } else {
                storeFulfillmentsMap.set(storeKey, ["F1"]); // Default to Delivery
            }
        });
        
        // First check if we have items from the item details form
        if (sellerData.items && sellerData.items.length > 0) {
            const allItems: any[] = [];
            let itemCounter = 0;
            
            // Process each item and its variants
            sellerData.items.forEach((item: any, parentIndex: number) => {
                // Get the variant group ID from the mapping
                const variantGroupId = (this as any)._itemToVariantGroupMap?.get(parentIndex) || this.ensureCategoryIdFormat(`V${parentIndex + 1}`);
                
                // Check if item has variants
                if (item.variants && item.variants.length > 0) {
                    // Process each variant as an individual item in the catalog
                    item.variants.forEach((variant: any, variantIndex: number) => {
                        itemCounter++;
                        const variantItem = this.createItemObject(
                            variant, 
                            itemCounter, 
                            variantGroupId,
                            storeFulfillmentsMap,
                            stores,
                            locationIds,
                            sellerData,
                            true, // isVariant flag
                            item  // parent item for reference
                        );
                        allItems.push(variantItem);
                    });
                    
                    // Also add the parent item if it should be available for purchase
                    // This allows selling both the base item and its variants
                    if (item.includeParentInCatalog !== false) {
                        itemCounter++;
                        const parentCatalogItem = this.createItemObject(
                            item, 
                            itemCounter, 
                            variantGroupId,
                            storeFulfillmentsMap,
                            stores,
                            locationIds,
                            sellerData,
                            false
                        );
                        allItems.push(parentCatalogItem);
                    }
                } else {
                    // Process regular item without variants
                    itemCounter++;
                    const regularItem = this.createItemObject(
                        item, 
                        itemCounter, 
                        variantGroupId,
                        storeFulfillmentsMap,
                        stores,
                        locationIds,
                        sellerData,
                        false
                    );
                    allItems.push(regularItem);
                }
            });
            
            return allItems;
        }
        
        // Fallback to menuItems for F&B domain
        // if (sellerData.menuItems && sellerData.menuItems.length > 0) {
        //     return sellerData.menuItems.map((item: any, index: number) => ({
        //         id: `I${index + 1}`,
        //         time: {
        //             label: "enable",
        //             timestamp: new Date().toISOString()
        //         },
        //         // rating: "4",
        //         parent_item_id: "V1",
        //         descriptor: {
        //             name: item.name,
        //             code: "1:DEFAULT001",
        //             symbol: item.images || "https://snp.com/images/i1.png",
        //             short_desc: item.shortDescription || item.name,
        //             long_desc: item.longDescription || item.shortDescription || item.name,
        //             images: [
        //                 item.images || "https://snp.com/images/i1.png"
        //             ]
        //         },
        //         quantity: {
        //             unitized: {
        //                 measure: {
        //                     unit: "piece",
        //                     value: "1"
        //                 }
        //             },
        //             available: {
        //                 count: "99"
        //             },
        //             maximum: {
        //                 count: "99"
        //             }
        //         },
        //         price: {
        //             currency: "INR",
        //             value: "65.00",
        //             maximum_value: "65.0"
        //         },
        //         category_id: sellerData.productCategories?.[0] || "Food Items",
        //         fulfillment_id: "F2",
        //         location_id: locationId,
        //         "@ondc/org/returnable": true,
        //         "@ondc/org/cancellable": true,
        //         "@ondc/org/return_window": "PT1H",
        //         "@ondc/org/seller_pickup_return": true,
        //         "@ondc/org/time_to_ship": "PT45M",
        //         "@ondc/org/available_on_cod": false,
        //         "@ondc/org/contact_details_consumer_care": "Support,support@store.com,18004254444",
        //         tags: [
        //             {
        //                 code: "origin",
        //                 list: [
        //                     {
        //                         code: "country",
        //                         value: "IND"
        //                     }
        //                 ]
        //             },
        //             {
        //                 code: "veg_nonveg",
        //                 list: [
        //                     {
        //                         code: "veg",
        //                         value: "yes"
        //                     }
        //                 ]
        //             }
        //         ]
        //     }));
        // }

        // Default item if no menu items
        const defaultLocationId = locationIds[0] || "L_DEFAULT";
        return [{
            id: "I1",
            time: {
                label: "enable",
                timestamp: new Date().toISOString()
            },
            rating: "4",
            parent_item_id: "V1",
            descriptor: {
                name: "Sample Item",
                code: "1:XXXXXXXXXXXXX",
                symbol: "https://snp.com/images/i1.png",
                short_desc: "Sample Item",
                long_desc: "Sample Item",
                images: [
                    "https://snp.com/images/i1.png"
                ]
            },
            quantity: {
                unitized: {
                    measure: {
                        unit: "piece",
                        value: "1"
                    }
                },
                available: {
                    count: "99"
                },
                maximum: {
                    count: "99"
                }
            },
            price: {
                currency: "INR",
                value: "65.00",
                maximum_value: "65.0"
            },
            category_id: sellerData.productCategories?.[0] || "General",
            fulfillment_id: "F2",
            location_id: defaultLocationId,
            "@ondc/org/returnable": true,
            "@ondc/org/cancellable": true,
            "@ondc/org/return_window": "PT1H",
            "@ondc/org/seller_pickup_return": true,
            "@ondc/org/time_to_ship": "PT45M",
            "@ondc/org/available_on_cod": false,
            "@ondc/org/contact_details_consumer_care": "Support,support@store.com,18004254444",
            tags: this.getItemTags({
                country_of_origin: "IND",
                veg_non_veg: "veg"
            }, sellerData.domain)
        }];
    }

    protected generateProviderTags(sellerData: any, locationIds: string[], domainCategories?: Set<string>) {
        console.log('generateProviderTags - Location IDs:', locationIds);
        const tags = [];
        const stores = sellerData.stores || [];
        
        // Validate that we have matching location IDs for stores
        if (stores.length !== locationIds.length) {
            // Mismatch between stores and location IDs
        }
        
        // Helper function to check if category should be included in this domain
        const isCategoryRelevantToDomain = (category: string): boolean => {
            if (!domainCategories || domainCategories.size === 0) {
                return true; // Include all if no domain filtering
            }
            
            // Check for exact match
            if (domainCategories.has(category)) {
                return true;
            }
            
            // Check for case-insensitive match
            const categoryLower = category.toLowerCase();
            return Array.from(domainCategories).some(domainCat => 
                domainCat.toLowerCase() === categoryLower
            );
        };
        
        // Add timing tags for each store location
        stores.forEach((store: any, index: number) => {
            const locationId = locationIds[index] || locationIds[0] || "L_DEFAULT";
            
            // Order timing for this store
            tags.push({
                code: "timing",
                list: [
                    {
                        code: "type",
                        value: "Order"
                    },
                    {
                        code: "location",
                        value: locationId
                    },
                    {
                        code: "day_from",
                        value: store.day_from || "1"
                    },
                    {
                        code: "day_to",
                        value: store.day_to || "7"
                    },
                    {
                        code: "time_from",
                        value: store.time_from || "0000"
                    },
                    {
                        code: "time_to",
                        value: store.time_to || "2359"
                    }
                ]
            });

            // Delivery timing for this store
            tags.push({
                code: "timing",
                list: [
                    {
                        code: "type",
                        value: "Delivery"
                    },
                    {
                        code: "location",
                        value: locationId
                    },
                    {
                        code: "day_from",
                        value: store.day_from || "1"
                    },
                    {
                        code: "day_to",
                        value: store.day_to || "7"
                    },
                    {
                        code: "time_from",
                        value: store.time_from || "1100"
                    },
                    {
                        code: "time_to",
                        value: store.time_to || "2200"
                    }
                ]
            });
            
            // Self-Pickup timing if supported
            if (store.supported_fulfillments === "Self-Pickup" || store.supported_fulfillments === "All") {
                tags.push({
                    code: "timing",
                    list: [
                        {
                            code: "type",
                            value: "Self-Pickup"
                        },
                        {
                            code: "location",
                            value: locationId
                        },
                        {
                            code: "day_from",
                            value: store.day_from || "1"
                        },
                        {
                            code: "day_to",
                            value: store.day_to || "7"
                        },
                        {
                            code: "time_from",
                            value: store.time_from || "1100"
                        },
                        {
                            code: "time_to",
                            value: store.time_to || "2200"
                        }
                    ]
                });
            }
        });
        
        // If no stores, add default timing
        if (stores.length === 0) {
            const defaultLocationId = locationIds[0] || "L_DEFAULT";
            tags.push({
                code: "timing",
                list: [
                    {
                        code: "type",
                        value: "Order"
                    },
                    {
                        code: "location",
                        value: defaultLocationId
                    },
                    {
                        code: "day_from",
                        value: "1"
                    },
                    {
                        code: "day_to",
                        value: "7"
                    },
                    {
                        code: "time_from",
                        value: "0000"
                    },
                    {
                        code: "time_to",
                        value: "2359"
                    }
                ]
            });

            tags.push({
                code: "timing",
                list: [
                    {
                        code: "type",
                        value: "Delivery"
                    },
                    {
                        code: "location",
                        value: defaultLocationId
                    },
                    {
                        code: "day_from",
                        value: "1"
                    },
                    {
                        code: "day_to",
                        value: "7"
                    },
                    {
                        code: "time_from",
                        value: "1100"
                    },
                    {
                        code: "time_to",
                        value: "2200"
                    }
                ]
            });
        }

        // Serviceability - Generate from all stores' serviceabilities
        stores.forEach((store: any, storeIndex: number) => {
            // Each store gets its own unique location ID that matches the locations array
            const storeLocationId = locationIds[storeIndex];
            
            if (!storeLocationId) {
                // No location ID for store, skipping serviceability
                return;
            }
            
            if (store.serviceabilities && store.serviceabilities.length > 0) {
                store.serviceabilities.forEach((serviceability: any) => {
                    console.log('Processing serviceability:', {
                        category: serviceability.category,
                        type: serviceability.type,
                        val: serviceability.val,
                        unit: serviceability.unit,
                        domainCategories: domainCategories ? Array.from(domainCategories) : [],
                        storeIndex
                    });
                    
                    if (serviceability.category && serviceability.type) {
                        // Only include serviceability if category is relevant to current domain
                        const isRelevant = isCategoryRelevantToDomain(serviceability.category);
                        console.log(`Category "${serviceability.category}" is relevant to domain: ${isRelevant}`);
                        
                        if (isRelevant) {
                            // Determine default values based on serviceability type
                            let defaultVal = "3";
                            let defaultUnit = "km";
                            
                            if (serviceability.type === "12") {
                                // PAN India
                                defaultVal = "IND";
                                defaultUnit = "country";
                            } else if (serviceability.type === "13") {
                                // Polygon - should have GeoJSON value
                                defaultUnit = "geojson";
                                // For polygon, val should be the GeoJSON string, no default
                                defaultVal = serviceability.val || "";
                            }
                            
                            const serviceabilityTag = {
                                code: "serviceability",
                                list: [
                                    {
                                        code: "location",
                                        value: storeLocationId  // Always use the store's own location ID
                                    },
                                    {
                                        code: "category",
                                        value: serviceability.category
                                    },
                                    {
                                        code: "type",
                                        value: serviceability.type // Already in ONDC format (10, 11, 12, 13)
                                    },
                                    {
                                        code: "val",
                                        value: serviceability.val || defaultVal
                                    },
                                    {
                                        code: "unit",
                                        value: serviceability.unit || defaultUnit
                                    }
                                ]
                            };
                            
                            console.log('Adding serviceability tag:', JSON.stringify(serviceabilityTag, null, 2));
                            tags.push(serviceabilityTag);
                        }
                    }
                });
            } else {
                // If c has no serviceabilities, use default for its supported subcategories
                const categoriesToUse = store.supported_subcategories || sellerData.productCategories || [];
                if (categoriesToUse.length > 0) {
                    categoriesToUse.forEach((category: string) => {
                        // Only include default serviceability if category is relevant to current domain
                        if (isCategoryRelevantToDomain(category)) {
                            tags.push({
                                code: "serviceability",
                                list: [
                                    {
                                        code: "location",
                                        value: storeLocationId  // Use the store's own location ID
                                    },
                                    {
                                        code: "category",
                                        value: category
                                    },
                                    {
                                        code: "type",
                                        value: "10" // Default to hyperlocal
                                    },
                                    {
                                        code: "val",
                                        value: "3"
                                    },
                                    {
                                        code: "unit",
                                        value: "km"
                                    }
                                ]
                            });
                        }
                    });
                }
            }
        });
        
        console.log(`Total serviceability tags added: ${tags.filter(t => t.code === 'serviceability').length}`);
        console.log('All tags:', JSON.stringify(tags.filter(t => t.code === 'serviceability'), null, 2));
        
        // If no stores at all, add default serviceability
        if (stores.length === 0) {
            const defaultLocationId = locationIds[0] || "L_DEFAULT";
            const defaultCategories = sellerData.productCategories || ["General"];
            
            defaultCategories.forEach((category: string) => {
                // Only include default serviceability if category is relevant to current domain
                if (isCategoryRelevantToDomain(category)) {
                    tags.push({
                        code: "serviceability",
                        list: [
                            {
                                code: "location",
                                value: defaultLocationId
                            },
                            {
                                code: "category",
                                value: category
                            },
                            {
                                code: "type",
                                value: "10" // Default to hyperlocal
                            },
                            {
                                code: "val",
                                value: "3"
                            },
                            {
                                code: "unit",
                                value: "km"
                            }
                        ]
                    });
                }
            });
        }

        return tags;
    }

    private getItemTags(item: any, domain: string | string[]): any[] {
        const tags = [];
        const domainCode = this.getDomainCode(domain);
        
        // Check if attributes are in nested object or at root level (for backward compatibility)
        const attrs = item.attributes || item;
        // Add variant group tag if item is a variant
        if (item.variantCombination) {
            const variantList: any[] = [];
            Object.entries(item.variantCombination).forEach(([key, value]) => {
                variantList.push({
                    code: key,
                    value: String(value)
                });
            });
            
            if (variantList.length > 0) {
                tags.push({
                    code: "variant_group",
                    list: variantList
                });
            }
        }

        // Common tags for all domains
        tags.push({
            code: "origin",
            list: [
                {
                    code: "country",
                    value: item.country_of_origin || "IND"
                }
            ]
        });

        // Domain-specific tags
        switch (domainCode) {
            case "ONDC:RET10": // Grocery
            case "ONDC:RET11": // F&B
                tags.push({
                    code: "veg_nonveg",
                    list: [
                        {
                            code: item.veg_non_veg === "veg" ? "veg" : "non-veg",
                            value: "yes"
                        }
                    ]
                });
                break;

            case "ONDC:RET12": // Fashion
                if (attrs.size || attrs.colour || item.brand || attrs.gender || attrs.fabric || attrs.material) {
                    const attrList = [];
                    if (item.brand) {
                        attrList.push({ code: "brand", value: item.brand });
                    }
                    if (attrs.size) {
                        attrList.push({ code: "size", value: attrs.size });
                    }
                    if (attrs.colour) {
                        attrList.push({ code: "colour", value: attrs.colour });
                    }
                    if (attrs.gender) {
                        attrList.push({ code: "gender", value: attrs.gender });
                    }
                    if (attrs.fabric) {
                        attrList.push({ code: "fabric", value: attrs.fabric });
                    }
                    if (attrs.material) {
                        attrList.push({ code: "material", value: attrs.material });
                    }
                    if (attrs.pattern) {
                        attrList.push({ code: "pattern", value: attrs.pattern });
                    }
                    if (attrs.fit) {
                        attrList.push({ code: "fit", value: attrs.fit });
                    }
                    if (attrs.occasion) {
                        attrList.push({ code: "occasion", value: attrs.occasion });
                    }
                    if (attrList.length > 0) {
                        tags.push({
                            code: "attribute",
                            list: attrList
                        });
                    }
                }
                break;

            case "ONDC:RET13": // BPC (Beauty & Personal Care)
                if (item.brand || attrs.gender || attrs.skin_type || attrs.concern || attrs.formulation) {
                    const attrList = [];
                    if (item.brand) {
                        attrList.push({ code: "brand", value: item.brand });
                    }
                    if (attrs.gender) {
                        attrList.push({ code: "gender", value: attrs.gender });
                    }
                    if (attrs.skin_type) {
                        attrList.push({ code: "skin_type", value: attrs.skin_type });
                    }
                    if (attrs.concern) {
                        attrList.push({ code: "concern", value: attrs.concern });
                    }
                    if (attrs.formulation) {
                        attrList.push({ code: "formulation", value: attrs.formulation });
                    }
                    if (attrs.ingredient) {
                        attrList.push({ code: "ingredient", value: attrs.ingredient });
                    }
                    if (attrList.length > 0) {
                        tags.push({
                            code: "attribute",
                            list: attrList
                        });
                    }
                }
                break;

            case "ONDC:RET14": // Electronics
            case "ONDC:RET15": // Appliances
                if (item.brand || attrs.warranty_period || attrs.model || attrs.screen_size || attrs.storage || attrs.ram) {
                    const attrList = [];
                    if (item.brand) {
                        attrList.push({ code: "brand", value: item.brand });
                    }
                    if (attrs.warranty_period) {
                        attrList.push({ code: "warranty", value: attrs.warranty_period });
                    }
                    if (attrs.model) {
                        attrList.push({ code: "model", value: attrs.model });
                    }
                    if (attrs.screen_size) {
                        attrList.push({ code: "screen_size", value: attrs.screen_size });
                    }
                    if (attrs.storage) {
                        attrList.push({ code: "storage", value: attrs.storage });
                    }
                    if (attrs.ram) {
                        attrList.push({ code: "ram", value: attrs.ram });
                    }
                    if (attrs.capacity) {
                        attrList.push({ code: "capacity", value: attrs.capacity });
                    }
                    if (attrs.energy_rating) {
                        attrList.push({ code: "energy_rating", value: attrs.energy_rating });
                    }
                    if (attrList.length > 0) {
                        tags.push({
                            code: "attribute",
                            list: attrList
                        });
                    }
                }
                break;

            case "ONDC:RET16": // Home & Kitchen
                if (item.brand || attrs.material || attrs.dimensions || attrs.weight) {
                    const attrList = [];
                    if (item.brand) {
                        attrList.push({ code: "brand", value: item.brand });
                    }
                    if (attrs.material) {
                        attrList.push({ code: "material", value: attrs.material });
                    }
                    if (attrs.dimensions) {
                        attrList.push({ code: "dimensions", value: attrs.dimensions });
                    }
                    if (attrs.weight) {
                        attrList.push({ code: "weight", value: attrs.weight });
                    }
                    if (attrList.length > 0) {
                        tags.push({
                            code: "attribute",
                            list: attrList
                        });
                    }
                }
                break;

            case "ONDC:RET18": // Health & Wellness
                if (item.brand || attrs.prescription_required || attrs.dosage_form || attrs.composition) {
                    const attrList = [];
                    if (item.brand) {
                        attrList.push({ code: "brand", value: item.brand });
                    }
                    if (attrs.prescription_required !== undefined) {
                        attrList.push({ code: "prescription_required", value: attrs.prescription_required ? "yes" : "no" });
                    }
                    if (attrs.dosage_form) {
                        attrList.push({ code: "dosage_form", value: attrs.dosage_form });
                    }
                    if (attrs.composition) {
                        attrList.push({ code: "composition", value: attrs.composition });
                    }
                    if (attrList.length > 0) {
                        tags.push({
                            code: "attribute",
                            list: attrList
                        });
                    }
                }
                break;
        }
        
        // Add any additional dynamic attributes that are present
        if (item.attributes) {
            const additionalAttrs = [];
            for (const [key, value] of Object.entries(item.attributes)) {
                // Skip already processed attributes and empty values
                if (value && value !== "" && !['size', 'colour', 'gender', 'fabric', 'material', 'pattern', 
                    'fit', 'occasion', 'skin_type', 'concern', 'formulation', 'ingredient', 
                    'warranty_period', 'model', 'screen_size', 'storage', 'ram', 'capacity', 
                    'energy_rating', 'dimensions', 'weight', 'prescription_required', 
                    'dosage_form', 'composition'].includes(key)) {
                    additionalAttrs.push({ code: key, value: String(value) });
                }
            }
            if (additionalAttrs.length > 0) {
                // Check if we already have an attribute tag
                const existingAttrTag = tags.find(tag => tag.code === "attribute");
                if (existingAttrTag) {
                    existingAttrTag.list.push(...additionalAttrs);
                } else {
                    tags.push({
                        code: "attribute",
                        list: additionalAttrs
                    });
                }
            }
        }

        return tags;
    }
}