import { Request, Response } from "express";
import { S3Service } from "../services/s3Service";
import multer from "multer";

export class ImageController {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  /**
   * Upload single image for seller onboarding
   */
  uploadSellerImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      
      if (!file) {
        res.status(400).json({
          success: false,
          message: "No file provided"
        });
        return;
      }

      const folder = "workbench-seller-onboarding";
      const result = await this.s3Service.uploadFile(file, folder);

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          imageUrl: result.url,
          imageKey: result.key,
          etag: result.etag
        }
      });
    } catch (error) {
      console.error("Error uploading seller image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : error
      });
    }
  };

  /**
   * Upload multiple images for seller onboarding
   */
  uploadSellerImages = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: "No files provided"
        });
        return;
      }

      const folder = "workbench-seller-onboarding";
      const results = await this.s3Service.uploadMultipleFiles(files, folder);

      res.status(200).json({
        success: true,
        message: `${results.length} images uploaded successfully`,
        data: {
          images: results.map(result => ({
            imageUrl: result.url,
            imageKey: result.key,
            originalName: result.originalName,
            etag: result.etag
          }))
        }
      });
    } catch (error) {
      console.error("Error uploading seller images:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload images",
        error: error instanceof Error ? error.message : error
      });
    }
  };

  /**
   * Get presigned URL for secure image access
   */
  getImageUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600; // Default 1 hour
      
      if (!key) {
        res.status(400).json({
          success: false,
          message: "Image key is required"
        });
        return;
      }

      // Check if file exists
      const exists = await this.s3Service.fileExists(key);
      if (!exists) {
        res.status(404).json({
          success: false,
          message: "Image not found"
        });
        return;
      }

      const presignedUrl = await this.s3Service.getPresignedUrl(key, expiresIn);

      res.status(200).json({
        success: true,
        message: "Presigned URL generated successfully",
        data: {
          presignedUrl,
          expiresIn,
          key
        }
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate image URL",
        error: error instanceof Error ? error.message : error
      });
    }
  };

  /**
   * Delete image from S3
   */
  deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          message: "Image key is required"
        });
        return;
      }

      const deleted = await this.s3Service.deleteFile(key);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: "Image deleted successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to delete image"
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
        error: error instanceof Error ? error.message : error
      });
    }
  };

  /**
   * Get image metadata
   */
  getImageInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({
          success: false,
          message: "Image key is required"
        });
        return;
      }

      const exists = await this.s3Service.fileExists(key);
      
      res.status(200).json({
        success: true,
        data: {
          exists,
          key,
          publicUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        }
      });
    } catch (error) {
      console.error("Error getting image info:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get image information",
        error: error instanceof Error ? error.message : error
      });
    }
  };
}