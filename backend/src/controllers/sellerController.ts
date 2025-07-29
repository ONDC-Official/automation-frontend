import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";

export class SellerController {
    private sellerService: SellerService;

    constructor() {
        this.sellerService = new SellerService();
    }

    createOnSearchPayload = async (req: Request, res: Response): Promise<void> => {
        try {
            const sellerData = req.body;
            const onSearchPayload = await this.sellerService.generateOnSearchPayload(sellerData);
            
            res.status(200).json({
                success: true,
                data: onSearchPayload
            });
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