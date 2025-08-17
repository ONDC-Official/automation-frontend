import { useForm } from "react-hook-form";
import { FormInput } from "../ui/forms/form-input";
import LoadingButton from "../ui/forms/loading-button";
import { SellerOnboardingData } from "../../pages/seller-onboarding";
import { useState } from "react";
import { domainOptions } from "../../constants/common.tsx";
import { Select } from "antd";

interface BasicInformationFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
}

const BasicInformationForm = ({
  initialData,
  onNext,
}: BasicInformationFormProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string[]>(
    initialData?.domain || []
  );
  const [domainError, setDomainError] = useState<string>("");

  const getSelectValues = () => {
    if (!selectedDomain || selectedDomain.length === 0) return [];
    return selectedDomain
      .map((domain) => {
        const optionByLabel = domainOptions.find(
          (option) => option.key === domain
        );
        if (optionByLabel) return optionByLabel.value;

        const optionByValue = domainOptions.find(
          (option) => option.value === domain
        );
        if (optionByValue) return optionByValue.value;

        return domain;
      })
      .filter(Boolean);
  };

  const handleDomainChange = (values: string[]) => {
    const domainLabels = values.map((value) => {
      const selectedOption = domainOptions.find(
        (option) => option.value === value
      );
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
  } = useForm({});

  // const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     if (file.size > 2 * 1024 * 1024) {
  //       alert("File size must be less than 2MB");
  //       event.target.value = "";
  //       return;
  //     }

  //     if (!file.type.startsWith("image/")) {
  //       alert("Please select a valid image file");
  //       event.target.value = "";
  //       return;
  //     }

  //     setSymbolImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const removeImage = () => {
  //   setSymbolImage(null);
  //   setImagePreview(null);
  //   // Clear the file input
  //   const fileInput = document.querySelector(
  //     'input[type="file"]'
  //   ) as HTMLInputElement;
  //   if (fileInput) {
  //     fileInput.value = "";
  //   }
  // };

  const onSubmit = (data: any) => {
    // if (!symbolImage) {
    //   alert("Please upload a symbol image");
    //   return;
    // }

    if (!selectedDomain || selectedDomain.length === 0) {
      setDomainError("Please select at least one domain");
      return;
    }

    setDomainError("");

    onNext({
      ...data,
      domain: selectedDomain,
      // symbolImage,
    });
    console.log("data with domain", { ...data, domain: selectedDomain });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="mb-4 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 labelClass">
            Domain
            <span className="text-red-500 ml-1">*</span>
          </label>
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
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {domainOptions.map((option) => (
              <Select.Option
                key={option.value}
                value={option.value}
                label={option.key}
              >
                {option.key}
              </Select.Option>
            ))}
          </Select>
          {domainError && (
            <p className="text-red-500 text-xs italic mt-1">{domainError}</p>
          )}
        </div>

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
            pattern: {
              value: /^[a-zA-Z0-9\s]+$/,
              message:
                "Provider name should only contain letters, numbers, and spaces",
            },
          }}
        />

        {/* <div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol Image/Logo
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  required
                />
              </div>

              {symbolImage && (
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <p className="text-sm text-green-700 font-medium truncate">
                    {symbolImage.name} uploaded successfully
                  </p>
                </div>
              )}

              {imagePreview && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 relative group">
                      <div className="w-24 h-24 bg-white rounded-lg border-2 border-gray-300 p-2 shadow-sm">
                        <img
                          src={imagePreview}
                          alt="Symbol preview"
                          className="w-full h-full object-contain rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        title="Remove image"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 focus:bg-red-600 transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 group-hover:scale-110"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {symbolImage?.name}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {symbolImage?.type?.split("/")[1]?.toUpperCase() ||
                              "Image"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {symbolImage
                              ? (symbolImage.size / 1024).toFixed(1)
                              : 0}{" "}
                            KB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, GIF (Max 2MB). Recommended size:
              100×100px or larger
            </p>
          </div>
        </div> */}

        <FormInput
          label="Symbol Image/Logo"
          placeholder="Enter Symbol Image URL"
          name="symbolImage"
          type="url"
          register={register}
          errors={errors}
          required="Symbol Image URL is required"
          validations={{
            pattern: {
              value:
                /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
              message: "Please enter a valid URL",
            },
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

        <FormInput
          label="Images (URL)"
          placeholder="Enter Images URL"
          name="images"
          type="url"
          register={register}
          errors={errors}
          required="Image URL is required"
          validations={{
            pattern: {
              value:
                /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
              message: "Please enter a valid URL",
            },
          }}
        />
      </div>

      <div className="flex justify-end mt-8">
        <LoadingButton buttonText="Next Step" type="submit" isLoading={false} />
      </div>
    </form>
  );
};

export default BasicInformationForm;
