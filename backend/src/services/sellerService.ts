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
    generateOnSearchPayload(sellerData: any) {
        console.log("SellerService: Received seller data:", JSON.stringify(sellerData, null, 2));
        console.log('sellerData>>>', sellerData)

        const timestamp = new Date().toISOString();
        const transactionId = uuidv4();
        const messageId = uuidv4();

        // Generate provider ID from seller data
        const providerId = `P_${Date.now()}`;
        const locationId = `L_${Date.now()}`;

        // Get first store data
        const firstStore = sellerData.stores?.[0] || {};

        const cityCode = MapCode(firstStore?.areaCode)
        const onSearchPayload = {
            context: {
                domain: (sellerData.domain && Array.isArray(sellerData.domain) && sellerData.domain.includes('Grocery')) ? "ONDC:RET10" : 
                        (sellerData.domain && sellerData.domain.includes('F&B')) ? "ONDC:RET11" : "ONDC:RET10",
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
                        {
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
                            locations: [
                                {
                                    id: locationId,
                                    time: {
                                        label: "enable",
                                        timestamp: timestamp,
                                        schedule: {
                                            holidays: firstStore.holiday || [
                                              
                                            ]
                                        }
                                    },
                                    gps: firstStore.gps || "12.9675,77.7496",
                                    address: {
                                        locality: firstStore.locality || "Jayanagar",
                                        street: firstStore.street || "Jayanagar 4th Block",
                                        city: firstStore.city || "Bengaluru",
                                        area_code: firstStore.areaCode || "560076",
                                        state: firstStore.state || "KA"
                                    }
                                }
                            ],
                            categories: this.generateCategories(sellerData),
                            items: this.generateItems(sellerData, locationId),
                            tags: this.generateProviderTags(sellerData, locationId)
                        }
                    ]
                }
            }
        };

        return onSearchPayload;
    }

    private generateCategories(sellerData: any) {
        const firstStore = sellerData.stores?.[0] || {};
        const categories = firstStore.supported_subcategories || sellerData.productCategories || [];
        
        if (categories.length > 0) {
            return categories.map((category: string, index: number) => ({
                id: `V${index + 1}`,
                descriptor: {
                    name: category
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
                        list: [
                            {
                                code: "name",
                                value: "item.quantity.unitized.measure"
                            },
                            {
                                code: "seq",
                                value: (index + 1).toString()
                            }
                        ]
                    }
                ]
            }));
        }
        
        // Default category for F&B
        // return [{
        //     id: "V1",
        //     descriptor: {
        //         name: "Variant Group 1"
        //     },
        //     tags: [
        //         {
        //             code: "type",
        //             list: [
        //                 {
        //                     code: "type",
        //                     value: "variant_group"
        //                 }
        //             ]
        //         },
        //         {
        //             code: "attr",
        //             list: [
        //                 {
        //                     code: "name",
        //                     value: "item.quantity.unitized.measure"
        //                 },
        //                 {
        //                     code: "seq",
        //                     value: "1"
        //                 }
        //             ]
        //         }
        //     ]
        // }];
    }

    private generateFulfillments(sellerData: any) {
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

    private generateItems(sellerData: any, locationId: string) {
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
            return sellerData.items.map((item: any, index: number) => {
                // Find the store fulfillments for this item
                const itemStore = item.store || 'default';
                const storeFulfillmentIds = storeFulfillmentsMap.get(itemStore) || ["F2"];
                const primaryFulfillmentId = storeFulfillmentIds[0]; // Use the first available fulfillment
                
                return {
                    id: `I${index + 1}`,
                    time: {
                        label: "enable",
                        timestamp: new Date().toISOString()
                    },
                    // rating: "4",
                    parent_item_id: "V1",
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
                            const codeNumber = codeTypeMap[item.code_type] || '1';
                            return `${codeNumber}:${item.code_value || 'XXXXXXXXXXXXX'}`;
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
                    tags: [
                    {
                        code: "origin",
                        list: [
                            {
                                code: "country",
                                value: item.country_of_origin || "IND"
                            }
                        ]
                    },
                    {
                        code: "veg_nonveg",
                        list: [
                            {
                                code: item.veg_non_veg === "veg" ? "veg" : "non-veg" ,
                                value: "yes",
                            }
                        ]
                    }
                    ]
                };
            });
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
            location_id: locationId,
            "@ondc/org/returnable": true,
            "@ondc/org/cancellable": true,
            "@ondc/org/return_window": "PT1H",
            "@ondc/org/seller_pickup_return": true,
            "@ondc/org/time_to_ship": "PT45M",
            "@ondc/org/available_on_cod": false,
            "@ondc/org/contact_details_consumer_care": "Support,support@store.com,18004254444",
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
                }
            ]
        }];
    }

    private generateProviderTags(sellerData: any, locationId: string) {
        const tags = [];
        const firstStore = sellerData.stores?.[0] || {};
        
        // Add FSSAI and PAN tags if available
        // if (firstStore.fssai_no || firstStore.pan_no) {
        //     const list = [];
        //     if (firstStore.fssai_no) {
        //         list.push({
        //             code: "FSSAI_license_no",
        //             value: firstStore.fssai_no
        //         });
        //     }
        //     if (firstStore.pan_no) {
        //         list.push({
        //             code: "pan_no",
        //             value: firstStore.pan_no
        //         });
        //     }
        //     tags.push({
        //         code: "FSSAI_pan_details",
        //         list: list
        //     });
        // }
        
        // Order timing
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
                    value: firstStore.day_from || "1"
                },
                {
                    code: "day_to",
                    value: firstStore.day_to || "7"
                },
                {
                    code: "time_from",
                    value: firstStore.time_from || "0000"
                },
                {
                    code: "time_to",
                    value: firstStore.time_to || "2359"
                }
            ]
        });

        // Delivery timing
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
                    value: firstStore.day_from || "1"
                },
                {
                    code: "day_to",
                    value: firstStore.day_to || "7"
                },
                {
                    code: "time_from",
                    value: firstStore.time_from || "1100"
                },
                {
                    code: "time_to",
                    value: firstStore.time_to || "2200"
                }
            ]
        });

        // Serviceability - Generate from all stores' serviceabilities
        const allServiceabilities = [];
        
        // Collect serviceabilities from all stores
        if (sellerData.stores && sellerData.stores.length > 0) {
            sellerData.stores.forEach((store: any, storeIndex: number) => {
                const storeLocationId = storeIndex === 0 ? locationId : `L${Date.now()}_${storeIndex}`;
                
                if (store.serviceabilities && store.serviceabilities.length > 0) {
                    store.serviceabilities.forEach((serviceability: any) => {
                        if (serviceability.category && serviceability.type) {
                            tags.push({
                                code: "serviceability",
                                list: [
                                    {
                                        code: "location",
                                        value: serviceability.location || storeLocationId
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
                                        value: serviceability.val || "3"
                                    },
                                    {
                                        code: "unit",
                                        value: serviceability.unit || "km"
                                    }
                                ]
                            });
                        }
                    });
                }
            });
        }
        
        // Fallback: If no serviceabilities found, use legacy logic
        if (tags.filter(tag => tag.code === "serviceability").length === 0) {
            const categoriesToUse = firstStore.supported_subcategories || sellerData.productCategories || [];
            if (categoriesToUse.length > 0) {
                categoriesToUse.forEach((category: string) => {
                    tags.push({
                        code: "serviceability",
                        list: [
                            {
                                code: "location",
                                value: locationId
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
                });
            }
        }

        return tags;
    }
}