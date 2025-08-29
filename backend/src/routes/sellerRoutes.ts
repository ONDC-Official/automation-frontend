import { Router } from "express";
import { SellerController } from "../controllers/sellerController";

const router = Router();
const sellerController = new SellerController();

// POST endpoint to create on_search payload from seller data
router.post("/on_search", sellerController.createOnSearchPayload);

export default router;