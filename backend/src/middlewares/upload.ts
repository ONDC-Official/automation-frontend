import multer from "multer";
import { S3_CONFIG } from "../config/s3Config";

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file type is allowed
  if (S3_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${S3_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: S3_CONFIG.MAX_FILE_SIZE, // 5MB
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
export const uploadSingle = upload.single('image');

// Middleware for multiple file upload
export const uploadMultiple = upload.array('images', 10);

// Middleware for fields with files
export const uploadFields = upload.fields([
  { name: 'symbolImage', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'menuImages', maxCount: 10 }
]);

export default upload;