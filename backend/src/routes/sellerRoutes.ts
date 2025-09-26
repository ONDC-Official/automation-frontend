import { Router } from "express";
import { SellerController } from "../controllers/sellerController";
import { ImageController } from "../controllers/imageController";
import { uploadFields } from "../middlewares/upload";

const router = Router();
const sellerController = new SellerController();
const imageController = new ImageController();

// POST endpoint to create on_search payload from seller data
router.post("/on_search", sellerController.createOnSearchPayload);

// Image upload endpoints for seller onboarding
router.post("/upload-images", uploadFields, imageController.uploadSellerImages);

// Enhanced seller onboarding with image upload support
router.post("/onboard-with-images", uploadFields, sellerController.createSellerWithImages);

export default router;