export interface IUploadImageResponse {
    success: boolean;
    message?: string;
    data: { imageUrl?: string };
}

export interface IUploadMultipleImagesResponse {
    success: boolean;
    message?: string;
    data: { images: { imageUrl?: string }[] };
}
