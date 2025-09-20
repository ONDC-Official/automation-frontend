import { Router } from "express";
import { ImageController } from "../controllers/imageController";
import { uploadSingle, uploadMultiple, uploadFields } from "../middlewares/upload";

const router = Router();
const imageController = new ImageController();

// Single image upload for seller onboarding
router.post("/upload", uploadSingle, imageController.uploadSellerImage);

// Multiple images upload for seller onboarding
router.post("/upload-multiple", uploadMultiple, imageController.uploadSellerImages);

// Upload with specific fields (symbol image, product images, menu images)
router.post("/upload-fields", uploadFields, imageController.uploadSellerImages);

// Get presigned URL for secure access
router.get("/url/:key", imageController.getImageUrl);

// Get image information
router.get("/info/:key", imageController.getImageInfo);

// Delete image
router.delete("/:key", imageController.deleteImage);

export default router;