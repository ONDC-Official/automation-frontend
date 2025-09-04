import React, { useState, useEffect } from "react";
import { Button, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { LabelWithToolTip } from "./form-input";

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
}

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
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(value);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // Sync with external value changes
  useEffect(() => {
    setUploadedUrl(value);
  }, [value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSizePerFile) {
        message.error(
          `File size must be less than ${maxSizePerFile / (1024 * 1024)}MB`
        );
        event.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        message.error("Please select a valid image file");
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

      const baseURL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(`${baseURL}/images/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const uploadedUrl = response.data.data.imageUrl;
        setUploadedUrl(uploadedUrl);
        setSelectedFile(null);
        setFilePreview(null);

        // Call onChange callback
        onChange?.(uploadedUrl);

        message.success("Image uploaded successfully!");
        return uploadedUrl;
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      message.error(
        "Failed to upload image: " +
          (error.response?.data?.message || error.message)
      );
      return null;
    } finally {
      setUploadLoading(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedUrl("");
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
      <LabelWithToolTip
        labelInfo={labelInfo}
        label={label}
        required={required}
      />

      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            name={`${folder}-single-image`}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          />
        </div>

        {selectedFile && !uploadedUrl && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-sm text-green-700 font-medium truncate">
              {selectedFile.name} ready for upload
            </p>
            <Button
              type="primary"
              size="small"
              loading={uploadLoading}
              onClick={uploadToS3}
              icon={<UploadOutlined />}
            >
              Upload
            </Button>
            <Button
              type="text"
              size="small"
              onClick={removeImage}
              icon={<DeleteOutlined />}
              danger
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
              type="text"
              size="small"
              onClick={removeImage}
              icon={<DeleteOutlined />}
              danger
            >
              Remove
            </Button>
          </div>
        )}

        {(filePreview || uploadedUrl) && (
          <div className="flex items-center space-x-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 shadow-sm">
            <div
              className={`${getPreviewSize()} bg-white rounded-lg border-2 border-gray-300 p-1 shadow-sm flex-shrink-0`}
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
        Accepted formats: JPG, PNG, GIF, WebP (Max{" "}
        {maxSizePerFile / (1024 * 1024)}MB).
      </p>
    </div>
  );
};

export default SingleImageUpload;
