import { useState } from "react";
import Stepper from "../components/ui/mini-components/stepper";
import BasicInformationForm from "../components/seller-onboarding/basic-information-form";
import BusinessVerificationForm from "../components/seller-onboarding/business-verification-form-multiple";
import CustomMenuForm from "../components/seller-onboarding/custom-menu-form";
import ItemDetailsForm from "../components/seller-onboarding/item-details-form";
import OnboardingSuccessPayload from "../components/seller-onboarding/onboarding-success-payload";
import { toast } from "react-toastify";
import { FaUser, FaBriefcase, FaUtensils, FaBox } from "react-icons/fa";
import axios from "axios";

export interface MenuItem {
  name: string;
  shortDescription: string;
  longDescription: string;
  images: string;
  dayFrom: string;
  dayTo: string;
  timeFrom: string;
  timeTo: string;
}

export interface ItemDetails {
  name: string;
  domain: string;
  code_type?: string;
  code_value?: string;
  symbol: string;
  short_desc: string;
  long_desc: string;
  images: string;

  // Quantity
  unit: string;
  value: string;
  available_count: string;
  maximum_count: string;
  minimum_count: string;

  // Price
  selling_price: string;
  mrp: string;
  currency: string;

  // Additional Details
  brand?: string;
  category: string;
  default_fulfillment_type: string;
  store: string;
  returnable: boolean;
  cancellable: boolean;
  return_window: string;
  return_window_unit?: string;
  return_window_value?: string;
  replacement_window: string;
  replacement_window_unit?: string;
  replacement_window_value?: string;
  time_to_ship: string;
  time_to_ship_unit?: string;
  time_to_ship_value?: string;
  cod_availability: boolean;

  // Consumer Care
  consumer_care_name: string;
  consumer_care_email: string;
  consumer_care_contact: string;

  // Miscellaneous Details
  country_of_origin?: string;
  veg_non_veg?: string;
  back_image?: string;
  refer_back_image?: boolean;

  // Statutory Requirements - Packaged Commodities
  manufacturer_or_packer_name?: string;
  manufacturer_or_packer_address?: string;
  common_or_generic_name_of_commodity?: string;
  net_quantity_or_measure_of_commodity_in_pkg?: string;
  month_year_of_manufacture_packing_import?: string;

  // Statutory Requirements - Prepackaged Food
  imported_product_country_of_origin?: string;
  nutritional_info?: string;
  additives_info?: string;
  brand_owner_name?: string;
  brand_owner_address?: string;
  brand_owner_fssai_license_no?: string;
  other_fssai_license_no?: string;
  importer_name?: string;
  importer_address?: string;
  importer_fssai_license_no?: string;
}

export interface StoreDetails {
  // Location Details
  gps?: string;
  locality?: string;
  street?: string;
  city?: string;
  areaCode?: string;
  state?: string;
  holiday?: string[];
  // Contact Details
  phone?: string;
  email?: string;
  // Store Timings
  type?: string;
  day_from?: string;
  day_to?: string;
  time_from?: string;
  time_to?: string;
  // Additional Details
  fssai_no?: string;
  // pan_no?: string;
  supported_subcategories?: string[];
  supported_fulfillments?: string;
  minimum_order_value?: number;
  // Serviceability
  serviceabilities?: Array<{
    location?: string;
    category?: string;
    type?: string;
    val?: string;
    unit?: string;
  }>;
}

export interface SellerOnboardingData {
  // Step 1: Basic Information Form
  domain?: string[];
  provider_name?: string;
  long_desc?: string;
  short_desc?: string;
  images?: string;
  symbolImage?: File;

  // Step 2: Business Details Form - Multiple Stores
  stores?: StoreDetails[];
  productCategories?: string[];

  // Legacy single store fields (for backward compatibility)
  gps?: string;
  locality?: string;
  street?: string;
  city?: string;
  areaCode?: string;
  state?: string;
  holiday?: string;
  type?: string;
  day_from?: string;
  day_to?: string;
  time_from?: string;
  time_to?: string;

  // Step 3: Verification & Documents Form
  fssai_no?: string;
  supported_subcategories?: string[];
  supported_fulfillments?: string;
  minimum_order_value?: number;

  // Step 4: Custom Menu (for F&B domain only)
  menuItems?: MenuItem[];

  // Step 5: Item Details
  items?: ItemDetails[];
}

const SellerOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SellerOnboardingData>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedData, setCompletedData] = useState<SellerOnboardingData>({});
  const [onSearchPayload, setOnSearchPayload] = useState<any>(null);

  const isFnBDomain = formData?.domain?.includes("F&B");

  const baseSteps = [
    { label: "Basic Information", icon: <FaUser /> },
    { label: "Business & Verification", icon: <FaBriefcase /> },
    { label: "Item Details", icon: <FaBox /> },
  ];

  const fnbSteps = [
    { label: "Basic Information", icon: <FaUser /> },
    { label: "Business & Verification", icon: <FaBriefcase /> },
    { label: "Custom Menu", icon: <FaUtensils /> },
    { label: "Item Details", icon: <FaBox /> },
  ];

  const steps = isFnBDomain ? fnbSteps : baseSteps;

  const handleStepComplete = (stepData: Partial<SellerOnboardingData>) => {
    setFormData({ ...formData, ...stepData });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setFormData({});
    setCompletedData({});
    setOnSearchPayload(null);
    setCurrentStep(0);
  };

  const handleSubmit = async (finalStepData: Partial<SellerOnboardingData>) => {
    const completeData = { ...formData, ...finalStepData };

    try {
      // Call the seller API to create on_search payload
      const baseURL =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(
        `${baseURL}/seller/on_search`,
        completeData
      );
      toast.success("Seller onboarding completed successfully!");

      // Set completion state and store completed data
      setCompletedData(completeData);
      setOnSearchPayload(response.data);
      setIsCompleted(true);
    } catch (error: any) {
      toast.error("Failed to complete onboarding. Please try again.");

      // Handle axios error response
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    }
  };

  const renderStep = () => {
    if (isFnBDomain) {
      switch (currentStep) {
        case 0:
          return (
            <BasicInformationForm
              initialData={formData}
              onNext={handleStepComplete}
            />
          );
        case 1:
          return (
            <BusinessVerificationForm
              initialData={formData}
              onNext={handleStepComplete}
              onPrevious={handlePreviousStep}
              isFinalStep={false}
              category={true}
              isFnBDomain={isFnBDomain}
            />
          );
        case 2:
          return (
            <CustomMenuForm
              initialData={formData}
              onNext={handleStepComplete}
              onPrevious={handlePreviousStep}
            />
          );
        case 3:
          return (
            <ItemDetailsForm
              initialData={formData}
              onNext={handleSubmit}
              onPrevious={handlePreviousStep}
            />
          );
        default:
          return null;
      }
    } else {
      switch (currentStep) {
        case 0:
          return (
            <BasicInformationForm
              initialData={formData}
              onNext={handleStepComplete}
            />
          );
        case 1:
          return (
            <BusinessVerificationForm
              initialData={formData}
              onNext={handleStepComplete}
              onPrevious={handlePreviousStep}
              isFinalStep={false}
              category={false}
            />
          );
        case 2:
          return (
            <ItemDetailsForm
              initialData={formData}
              onNext={handleSubmit}
              onPrevious={handlePreviousStep}
            />
          );
        default:
          return null;
      }
    }
  };

  if (isCompleted && onSearchPayload) {
    return (
      <OnboardingSuccessPayload
        submittedData={completedData}
        onSearchPayload={onSearchPayload}
        onBack={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text">
            Seller Onboarding
          </h1>
          <p className="text-gray-600 mt-2">
            Complete the following steps to register as a seller
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">{renderStep()}</div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
