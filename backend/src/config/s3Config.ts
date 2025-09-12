import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export default s3Client;

export const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_BUCKET_NAME || "",
  REGION: process.env.AWS_REGION || "ap-south-1",
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp"
  ],
};