import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Select, message } from "antd";

import { FormInput, LabelWithToolTip } from "@components/ui/forms/form-input";
import LoadingButton from "@components/ui/forms/loading-button";
import { SellerOnboardingData } from "@pages/seller-onboarding";
import { domainOptions } from "@constants/common.tsx";
import MultiImageUpload from "@components/ui/forms/multi-image-upload";
import SingleImageUpload from "@components/ui/forms/single-image-upload";
import { useSingleImageUpload, useMultiImageUpload } from "@hooks/useImageUpload";

interface BasicInformationFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
}

const BasicInformationForm = ({ initialData, onNext }: BasicInformationFormProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string[]>(initialData?.domain || []);
  const [domainError, setDomainError] = useState<string>("");

  // Use optimized hooks for image state management
  const symbolImage = useSingleImageUpload(initialData?.symbolImage || "");
  const productImages = useMultiImageUpload(
    initialData?.images ? (Array.isArray(initialData.images) ? initialData.images : [initialData.images]) : [],
  );

  const getSelectValues = () => {
    if (!selectedDomain || selectedDomain.length === 0) return [];
    return selectedDomain
      .map(domain => {
        const optionByLabel = domainOptions.find(option => option.key === domain);
        if (optionByLabel) return optionByLabel.value;

        const optionByValue = domainOptions.find(option => option.value === domain);
        if (optionByValue) return optionByValue.value;

        return domain;
      })
      .filter(Boolean);
  };

  const handleDomainChange = (values: string[]) => {
    const domainLabels = values.map(value => {
      const selectedOption = domainOptions.find(option => option.value === value);
      return selectedOption ? selectedOption.key : value;
    });

    setSelectedDomain(domainLabels);

    if (domainError && values.length > 0) {
      setDomainError("");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      provider_name: initialData?.provider_name || "",
      long_desc: initialData?.long_desc || "",
      short_desc: initialData?.short_desc || "",
    },
  });

  // Reset form when initialData changes (when navigating back)
  useEffect(() => {
    reset({
      provider_name: initialData?.provider_name || "",
      long_desc: initialData?.long_desc || "",
      short_desc: initialData?.short_desc || "",
    });

    // Update domain selection state
    if (initialData?.domain) {
      setSelectedDomain(initialData.domain);
      setDomainError("");
    }

    // Update symbol image using hook
    symbolImage.resetImage(
      initialData?.symbolImage && typeof initialData.symbolImage === "string" ? initialData.symbolImage : "",
    );

    // Update product images using hook
    if (initialData?.images && Array.isArray(initialData.images)) {
      productImages.resetImages(initialData.images);
    } else if (initialData?.images && typeof initialData.images === "string") {
      productImages.resetImages([initialData.images]);
    } else {
      productImages.resetImages([]);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: any) => {
    if (!selectedDomain || selectedDomain.length === 0) {
      setDomainError("Please select at least one domain");
      return;
    }

    if (!symbolImage.imageUrl) {
      message.error("Please upload a symbol image");
      return;
    }

    if (productImages.imageUrls.length === 0) {
      message.error("Please upload at least one image");
      return;
    }

    setDomainError("");

    onNext({
      ...data,
      domain: selectedDomain,
      symbolImage: symbolImage.imageUrl,
      images: productImages.imageUrls,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Domain Selection - Full Width */}
      <div className="mb-6">
        <LabelWithToolTip labelInfo={""} label={"Domain"} required={true} />
        <Select
          mode="multiple"
          placeholder="Select one or more domains"
          value={getSelectValues()}
          onChange={handleDomainChange}
          style={{ width: "100%" }}
          size="large"
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
          }>
          {domainOptions.map(option => (
            <Select.Option key={option.value} value={option.value} label={option.key}>
              {option.key}
            </Select.Option>
          ))}
        </Select>
        {domainError && <p className="text-red-500 text-xs italic mt-1">{domainError}</p>}
      </div>

      {/* Symbol Image Upload Section */}
      <div className="mb-6">
        <SingleImageUpload
          label="Symbol Image/Logo"
          labelInfo="Upload your brand logo or symbol image"
          required={true}
          folder="workbench-seller-onboarding"
          value={symbolImage.imageUrl}
          onChange={symbolImage.setImageUrl}
          previewSize="medium"
        />
      </div>

      {/* Form Fields Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <FormInput
          label="Provider Name"
          name="provider_name"
          placeholder="Enter Provider Name"
          type="text"
          register={register}
          errors={errors}
          required="Provider Name is required"
          validations={{
            minLength: {
              value: 3,
              message: "Provider name must be at least 3 characters",
            },
            maxLength: {
              value: 100,
              message: "Provider name cannot exceed 100 characters",
            },
            // pattern: {
            //   value: /^[a-zA-Z0-9\s]+$/,
            //   message:
            //     "Provider name should only contain letters, numbers, and spaces",
            // },
          }}
        />
        <FormInput
          label="Long Description"
          placeholder="Enter Long Description"
          name="long_desc"
          register={register}
          errors={errors}
          required="Long Description is required"
          validations={{
            minLength: {
              value: 20,
              message: "Long description must be at least 20 characters",
            },
            maxLength: {
              value: 1000,
              message: "Long description cannot exceed 1000 characters",
            },
          }}
        />

        <FormInput
          label="Short Description"
          placeholder="Enter Short Description"
          name="short_desc"
          register={register}
          errors={errors}
          required="Short Description is required"
          validations={{
            minLength: {
              value: 3,
              message: "Short description must be at least 3 characters",
            },
            maxLength: {
              value: 50,
              message: "Short description cannot exceed 50 characters",
            },
          }}
        />

        <div className="md:col-span-2">
          <MultiImageUpload
            label="Product Images"
            labelInfo="Upload multiple product images"
            required={true}
            folder="workbench-seller-onboarding"
            value={productImages.imageUrls}
            onChange={productImages.setImageUrls}
            maxFiles={10}
            previewSize="small"
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <LoadingButton buttonText="Next Step" type="submit" isLoading={false} />
      </div>
    </form>
  );
};

export default BasicInformationForm;
