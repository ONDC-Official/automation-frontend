import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { S3_CONFIG } from "../config/s3Config";
import { v4 as uuidv4 } from "uuid";

export class S3Service {
  
  /**
   * Upload file to S3 bucket
   */
  async uploadFile(
    file: Express.Multer.File, 
    folder: string = "workbench-seller-onboarding"
  ): Promise<{ key: string; url: string; etag?: string }> {
    try {
      // Generate unique filename
      console.log('file.originalname', file.originalname)
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;
      console.log('uniqueFileName', uniqueFileName)
      
      // Validate file type
      if (!S3_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error(`Invalid file type. Allowed types: ${S3_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`);
      }
      
      // Validate file size
      if (file.size > S3_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size: ${S3_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      const uploadParams = {
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        }
      };
      const command = new PutObjectCommand(uploadParams);
      const result = await s3Client.send(command);

      // Generate public URL
      const publicUrl = `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${uniqueFileName}`;

      return {
        key: uniqueFileName,
        url: publicUrl,
        etag: result.ETag
      };
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Generate presigned URL for secure file access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Delete file from S3 bucket
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Check if file exists in S3 bucket
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw new Error(`Error checking file existence: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[], 
    folder: string = "workbench-seller-onboarding"
  ): Promise<Array<{ key: string; url: string; originalName: string; etag?: string }>> {
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await this.uploadFile(file, folder);
        return {
          ...result,
          originalName: file.originalname
        };
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Error uploading multiple files:", error);
      throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : error}`);
    }
  }
}