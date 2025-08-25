import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";
import { FBSellerService } from "../services/fbSellerService";

export class SellerController {
    private sellerService: SellerService;
    private fbSellerService: FBSellerService;

    constructor() {
        this.sellerService = new SellerService();
        this.fbSellerService = new FBSellerService();
    }

    createOnSearchPayload = async (req: Request, res: Response): Promise<void> => {
        try {
            const sellerData = req.body;
            
            // Check if domains is an array
            if (Array.isArray(sellerData.domain)) {
                // Generate separate payloads for each domain
                const payloadsByDomain: { [key: string]: any } = {};
                
                for (const domain of sellerData.domain) {
                    // Filter items and stores for this specific domain
                    const domainItems = sellerData.items?.filter((item: any) => item.domain === domain) || [];
                    
                    // Get categories supported by this domain from items
                    const domainCategories = new Set<string>();
                    domainItems.forEach((item: any) => {
                        if (item.category) {
                            domainCategories.add(item.category);
                        }
                    });
                    
                    // Add domain-specific default categories if available
                    const domainCategoryMap: { [key: string]: string[] } = {
                        "Grocery": ["Fruits and Vegetables", "Foodgrains", "Oil & Masala", "Beverages", "Snacks"],
                        "Fashion": ["Clothing", "Footwear", "Accessories", "Jewelry", "Bags"],
                        "BPC": ["Skincare", "Haircare", "Makeup", "Fragrances", "Personal Care"],
                        "Electronics": ["Mobile", "Computer", "TV & Appliances", "Camera", "Audio"],
                        "Appliances": ["Kitchen Appliances", "Home Appliances", "Personal Care Appliances"],
                        "Home & Kitchen": ["Kitchen", "Home Decor", "Furniture", "Storage"],
                        "Health & Wellness": ["Healthcare", "Fitness", "Nutrition", "Personal Care"],
                        "F&B": ["Fast Food", "Beverages", "Desserts", "Indian", "Chinese"]
                    };
                    
                    // If no item categories found, use domain defaults for store filtering
                    if (domainCategories.size === 0 && domainCategoryMap[domain]) {
                        domainCategoryMap[domain].forEach(cat => domainCategories.add(cat));
                    }
                    
                    // Filter stores that support categories for this domain
                    const domainStores = sellerData.stores?.filter((store: any) => {
                        if (!store.supported_subcategories || store.supported_subcategories.length === 0) {
                            return true; // Include stores with no specific category restrictions
                        }
                        
                        // Check if store supports any categories for this domain (case-insensitive)
                        return store.supported_subcategories.some((storeCategory: string) => {
                            // Direct match
                            if (domainCategories.has(storeCategory)) {
                                return true;
                            }
                            
                            // Case-insensitive match
                            const storeCatLower = storeCategory.toLowerCase();
                            return Array.from(domainCategories).some(domainCat => 
                                domainCat.toLowerCase() === storeCatLower
                            );
                        });
                    }) || [];
                    
                    const domainSpecificData = {
                        ...sellerData,
                        domain: domain,
                        items: domainItems,
                        stores: domainStores
                    };
                    
                    // Only generate payload if there are items and stores for this domain
                    if (domainSpecificData.items.length > 0 && domainSpecificData.stores.length > 0) {
                        let onSearchPayload;
                        if (domain === "F&B") {
                            onSearchPayload = await this.fbSellerService.generateFBOnSearchPayload(domainSpecificData, domainCategories);
                        } else {
                            onSearchPayload = await this.sellerService.generateOnSearchPayload(domainSpecificData, domainCategories);
                        }
                        payloadsByDomain[domain] = onSearchPayload;
                    }
                }
                
                res.status(200).json({
                    success: true,
                    data: payloadsByDomain,
                    type: 'multi-domain'
                });
            } else {
                // Single domain - existing behavior
                // Extract categories from items for single domain as well
                const singleDomainCategories = new Set<string>();
                if (sellerData.items) {
                    sellerData.items.forEach((item: any) => {
                        if (item.category) {
                            singleDomainCategories.add(item.category);
                        }
                    });
                }
                
                let onSearchPayload;
                if (sellerData.domain === "F&B") {
                    onSearchPayload = await this.fbSellerService.generateFBOnSearchPayload(sellerData, singleDomainCategories);
                } else {
                    onSearchPayload = await this.sellerService.generateOnSearchPayload(sellerData, singleDomainCategories);
                }
                
                res.status(200).json({
                    success: true,
                    data: onSearchPayload,
                    type: 'single-domain'
                });
            }
        } catch (error) {
            console.error("Error creating on_search payload:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : error
            });
        }
    };
}