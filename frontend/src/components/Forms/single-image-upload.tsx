import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { FaUpload, FaTrash } from "react-icons/fa";
import { useUploadImageMutation } from "@store/api";
import { LabelWithToolTip } from "@/components/Shadcn/TextField";
import { Button } from "@/components/Shadcn/Button";
import { Input } from "@components/Shadcn/Input";

interface SingleImageUploadProps {
    label: string;
    labelInfo?: string;
    required?: boolean;
    folder?: string;
    value?: string;
    onChange?: (url: string) => void;
    maxSizePerFile?: number;
    className?: string;
    previewSize?: "small" | "medium" | "large";
    defaultImageUrl?: string;
    allowUrlInput?: boolean;
}

const baseUrl = new URL(import.meta.env.VITE_BASE_URL).origin;
const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
    label,
    labelInfo = "",
    required = false,
    folder = "workbench-seller-onboarding",
    value = "",
    onChange,
    maxSizePerFile = 5 * 1024 * 1024, // 5MB
    className = "",
    previewSize = "medium",
    defaultImageUrl = `${baseUrl}/images/ondc-logo.png`,
    allowUrlInput = true,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string>(value);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);
    const [urlInputValue, setUrlInputValue] = useState<string>("");
    const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
    const [uploadImage] = useUploadImageMutation();

    // Sync with external value changes
    useEffect(() => {
        setUploadedUrl(value);
    }, [value]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > maxSizePerFile) {
                toast.error(`File size must be less than ${maxSizePerFile / (1024 * 1024)}MB`);
                event.target.value = "";
                return;
            }

            if (!file.type.startsWith("image/")) {
                toast.error("Please select a valid image file");
                event.target.value = "";
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadToS3 = async (): Promise<string | null> => {
        if (!selectedFile) return null;

        try {
            setUploadLoading(true);
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("folder", folder);

            const response = await uploadImage(formData).unwrap();

            if (response.success) {
                const uploadedUrl = response.data.imageUrl || defaultImageUrl;
                setUploadedUrl(uploadedUrl);
                setSelectedFile(null);
                setFilePreview(null);

                // Call onChange callback
                onChange?.(uploadedUrl);

                toast.success("Image uploaded successfully!");
                return uploadedUrl;
            } else {
                throw new Error(response.message || "Upload failed");
            }
        } catch (error: unknown) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image. Using default image URL.");
            // Use default URL on upload failure
            const fallbackUrl = defaultImageUrl;
            setUploadedUrl(fallbackUrl);
            setSelectedFile(null);
            setFilePreview(null);
            onChange?.(fallbackUrl);
            return fallbackUrl;
        } finally {
            setUploadLoading(false);
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInputValue.trim()) {
            toast.warning("Please enter an image URL");
            return;
        }

        // Basic URL validation
        try {
            new URL(urlInputValue);
            setUploadedUrl(urlInputValue);
            onChange?.(urlInputValue);
            setUrlInputValue("");
            toast.success("Image URL set successfully!");
        } catch (error: unknown) {
            toast.error("Please enter a valid URL");
            console.error("Error setting image URL:", error);
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadedUrl("");
        setUrlInputValue("");
        onChange?.("");

        // Clear the file input
        const fileInput = document.querySelector(
            `input[name="${folder}-single-image"]`
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const getPreviewSize = () => {
        switch (previewSize) {
            case "small":
                return "w-12 h-12";
            case "large":
                return "w-24 h-24";
            default:
                return "w-16 h-16";
        }
    };

    return (
        <div className={`mb-4 w-full ${className}`}>
            <LabelWithToolTip labelInfo={labelInfo} label={label} required={required} />

            <div className="space-y-4">
                {allowUrlInput && (
                    <div className="flex gap-2 mb-2">
                        <Button
                            variant={inputMode === "upload" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("upload")}
                        >
                            Upload File
                        </Button>
                        <Button
                            variant={inputMode === "url" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("url")}
                        >
                            Enter URL
                        </Button>
                    </div>
                )}

                {inputMode === "upload" ? (
                    <div className="relative">
                        <Input
                            type="file"
                            accept="image/*"
                            name={`${folder}-single-image`}
                            onChange={handleFileChange}
                            className="h-auto w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100 transition-colors"
                        />
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                            value={urlInputValue}
                            onChange={(e) => setUrlInputValue(e.target.value)}
                            className="flex-1 rounded-md text-sm"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleUrlSubmit();
                                }
                            }}
                        />
                        <Button onClick={handleUrlSubmit}>Set URL</Button>
                    </div>
                )}

                {selectedFile && !uploadedUrl && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                        <p className="text-sm text-green-700 font-medium truncate">
                            {selectedFile.name} ready for upload
                        </p>
                        <Button
                            size="sm"
                            isLoading={uploadLoading}
                            onClick={uploadToS3}
                            icon={<FaUpload />}
                        >
                            Upload
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            icon={<FaTrash />}
                            className="text-destructive hover:text-destructive"
                        >
                            Remove
                        </Button>
                    </div>
                )}

                {uploadedUrl && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium truncate">
                            Url - {uploadedUrl}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeImage}
                            icon={<FaTrash />}
                            className="text-destructive hover:text-destructive"
                        >
                            Remove
                        </Button>
                    </div>
                )}

                {(filePreview || uploadedUrl) && (
                    <div className="flex items-center space-x-4 p-3 bg-linear-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 shadow-xs">
                        <div
                            className={`${getPreviewSize()} bg-white rounded-lg border-2 border-gray-300 p-1 shadow-xs shrink-0`}
                        >
                            <img
                                src={filePreview || uploadedUrl}
                                alt="Image preview"
                                className="w-full h-full object-contain rounded"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {selectedFile?.name || "Uploaded Image"}
                            </h4>
                            {selectedFile && (
                                <div className="flex items-center space-x-4 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {selectedFile.type?.split("/")[1]?.toUpperCase() || "Image"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
                Accepted formats: JPG, PNG, GIF, WebP (Max {maxSizePerFile / (1024 * 1024)}MB).
            </p>
        </div>
    );
};

export default SingleImageUpload;
