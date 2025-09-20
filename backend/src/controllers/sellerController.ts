import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";
import { FBSellerService } from "../services/fbSellerService";
import { S3Service } from "../services/s3Service";
import { DOMAIN_CATEGORY_MAP, getDomainCategories, DomainType } from "../config/domainCategoryConfig";

export class SellerController {
    private sellerService: SellerService;
    private fbSellerService: FBSellerService;
    private s3Service: S3Service;

    constructor() {
        this.sellerService = new SellerService();
        this.fbSellerService = new FBSellerService();
        this.s3Service = new S3Service();
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
                    
                    
                    // If no item categories found, use domain defaults for store filtering
                    const defaultCategories = getDomainCategories(domain);
                    if (domainCategories.size === 0 && defaultCategories.length > 0) {
                        defaultCategories.forEach(cat => domainCategories.add(cat));
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
                        if (domain === DomainType.FNB) {
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
                if (sellerData.domain === DomainType.FNB) {
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

    /**
     * Create seller onboarding with image upload support
     */
    createSellerWithImages = async (req: Request, res: Response): Promise<void> => {
        try {
            const sellerData = JSON.parse(req.body.sellerData || '{}');
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            
            // Upload symbol image if provided
            if (files.symbolImage && files.symbolImage[0]) {
                const symbolResult = await this.s3Service.uploadFile(files.symbolImage[0], "seller-symbols");
                sellerData.symbolImage = symbolResult.url;
            }
            
            // Upload product images if provided
            if (files.images && files.images.length > 0) {
                const imageResults = await this.s3Service.uploadMultipleFiles(files.images, "seller-products");
                sellerData.images = imageResults.map(result => result.url);
            }
            
            // Upload menu images if provided (for F&B domain)
            if (files.menuImages && files.menuImages.length > 0) {
                const menuImageResults = await this.s3Service.uploadMultipleFiles(files.menuImages, "seller-menu");
                
                // Map menu images to menu items
                if (sellerData.menuItems && Array.isArray(sellerData.menuItems)) {
                    sellerData.menuItems.forEach((menuItem: any, index: number) => {
                        if (menuImageResults[index]) {
                            menuItem.images = menuImageResults[index].url;
                        }
                    });
                }
            }

            // Process the seller data with images
            const sellerDataWithImages = { ...sellerData };

            // Check if domains is an array for multi-domain processing
            if (Array.isArray(sellerDataWithImages.domain)) {
                const payloadsByDomain: { [key: string]: any } = {};
                
                for (const domain of sellerDataWithImages.domain) {
                    const domainItems = sellerDataWithImages.items?.filter((item: any) => item.domain === domain) || [];
                    const domainCategories = new Set<string>();
                    domainItems.forEach((item: any) => {
                        if (item.category) {
                            domainCategories.add(item.category);
                        }
                    });
                    
                    const defaultCategories = getDomainCategories(domain);
                    if (domainCategories.size === 0 && defaultCategories.length > 0) {
                        defaultCategories.forEach(cat => domainCategories.add(cat));
                    }
                    
                    const domainStores = sellerDataWithImages.stores?.filter((store: any) => {
                        if (!store.supported_subcategories || store.supported_subcategories.length === 0) {
                            return true;
                        }
                        return store.supported_subcategories.some((storeCategory: string) => {
                            if (domainCategories.has(storeCategory)) {
                                return true;
                            }
                            const storeCatLower = storeCategory.toLowerCase();
                            return Array.from(domainCategories).some(domainCat => 
                                domainCat.toLowerCase() === storeCatLower
                            );
                        });
                    }) || [];
                    
                    const domainSpecificData = {
                        ...sellerDataWithImages,
                        domain: domain,
                        items: domainItems,
                        stores: domainStores
                    };
                    
                    if (domainSpecificData.items.length > 0 && domainSpecificData.stores.length > 0) {
                        let onSearchPayload;
                        if (domain === DomainType.FNB) {
                            onSearchPayload = await this.fbSellerService.generateFBOnSearchPayload(domainSpecificData, domainCategories);
                        } else {
                            onSearchPayload = await this.sellerService.generateOnSearchPayload(domainSpecificData, domainCategories);
                        }
                        payloadsByDomain[domain] = onSearchPayload;
                    }
                }
                
                res.status(200).json({
                    success: true,
                    message: "Seller onboarding completed with images",
                    data: payloadsByDomain,
                    type: 'multi-domain',
                    uploadedImages: {
                        symbolImage: sellerDataWithImages.symbolImage,
                        productImages: sellerDataWithImages.images,
                        menuImages: files.menuImages ? files.menuImages.map(f => f.originalname) : []
                    }
                });
            } else {
                // Single domain processing
                const singleDomainCategories = new Set<string>();
                if (sellerDataWithImages.items) {
                    sellerDataWithImages.items.forEach((item: any) => {
                        if (item.category) {
                            singleDomainCategories.add(item.category);
                        }
                    });
                }
                
                let onSearchPayload;
                if (sellerDataWithImages.domain === DomainType.FNB) {
                    onSearchPayload = await this.fbSellerService.generateFBOnSearchPayload(sellerDataWithImages, singleDomainCategories);
                } else {
                    onSearchPayload = await this.sellerService.generateOnSearchPayload(sellerDataWithImages, singleDomainCategories);
                }
                
                res.status(200).json({
                    success: true,
                    message: "Seller onboarding completed with images",
                    data: onSearchPayload,
                    type: 'single-domain',
                    uploadedImages: {
                        symbolImage: sellerDataWithImages.symbolImage,
                        productImages: sellerDataWithImages.images,
                        menuImages: files.menuImages ? files.menuImages.map(f => f.originalname) : []
                    }
                });
            }
        } catch (error) {
            console.error("Error creating seller with images:", error);
            res.status(500).json({
                success: false,
                message: "Failed to complete seller onboarding with images",
                error: error instanceof Error ? error.message : error
            });
        }
    };
}