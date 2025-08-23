import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  ItemDetails,
  SellerOnboardingData,
} from "../../pages/seller-onboarding";
import { toast } from "react-toastify";
import { FaPlus, FaMinus, FaBox, FaEdit } from "react-icons/fa";
import { Select, Input, Checkbox, Modal, Button, Form } from "antd";
import LoadingButton from "../ui/forms/loading-button";
import { categoryProtocolMappings, countries } from "../../constants/common";
import { fashion } from "../../constants/fashion";
import { BPCJSON } from "../../constants/bcp";
import { electronicsData } from "../../constants/electronics";
import { health } from "../../constants/health";
import { homeJSON } from "../../constants/home";
import { applianceData } from "../../constants/appliances";
import { getFnBAttributes } from "../../constants/fnb";
import { domainCategories } from "../../constants/categories";

interface ItemDetailsFormProps {
  initialData: SellerOnboardingData;
  onNext: (data: Partial<SellerOnboardingData>) => void;
  onPrevious: () => void;
}

interface FormData {
  items: ItemDetails[];
}

const ItemDetailsForm: React.FC<ItemDetailsFormProps> = ({
  initialData,
  onNext,
  onPrevious,
}) => {
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  // State to track selected optional attributes for each item
  const [selectedOptionalAttributes, setSelectedOptionalAttributes] = useState<{
    [itemIndex: number]: string[];
  }>({});

  // Consumer Care data state
  const [useExistingConsumerCare, setUseExistingConsumerCare] = useState<{
    [itemIndex: number]: boolean;
  }>({});

  // Variant state for each item
  const [showVariantModal, setShowVariantModal] = useState<{
    [itemIndex: number]: boolean;
  }>({});
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<{
    [itemIndex: number]: string[];
  }>({});
  const [itemVariants, setItemVariants] = useState<{
    [itemIndex: number]: any[];
  }>({});
  const [variantValues, setVariantValues] = useState<{
    [itemIndex: number]: { [attribute: string]: string[] };
  }>({});
  const [editVariantModal, setEditVariantModal] = useState<{
    visible: boolean;
    itemIndex: number | null;
    variantIndex: number | null;
  }>({
    visible: false,
    itemIndex: null,
    variantIndex: null,
  });
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [variantForm] = Form.useForm();

  const parseDuration = (duration: string) => {
    if (!duration) return { unit: "hour", value: "1" };

    const dayMatch = duration.match(/^P(\d+)D$/);
    if (dayMatch) {
      return { unit: "day", value: dayMatch[1] };
    }

    const hourMatch = duration.match(/^PT(\d+)H$/);
    if (hourMatch) {
      return { unit: "hour", value: hourMatch[1] };
    }

    const minuteMatch = duration.match(/^PT(\d+)M$/);
    if (minuteMatch) {
      return { unit: "minute", value: minuteMatch[1] };
    }

    return { unit: "hour", value: "1" };
  };

  const processInitialItems = () => {
    return (
      initialData.items?.map((item) => {
        const processedItem = { ...item };

        // Ensure attributes object exists
        if (!processedItem.attributes) {
          processedItem.attributes = {};
        }

        // Migrate any existing attributes from root level to attributes object
        const attributeKeys = [
          "gender",
          "colour",
          "size",
          "size_chart",
          "fabric",
          "colour_name",
          "pattern",
          "material",
          "season",
          "occasion",
          "sleeve_length",
          "collar",
          "fit",
          "neck",
          "hemline",
          "coverage",
          "padding",
          "closure_type",
          "fasten_type",
          "water_resistant",
          "sport_type",
          "material_finish",
          "fabric_finish",
          "concern",
          "ingredient",
          "conscious",
          "preference",
          "formulation",
          "skin_type",
          "manufacturer",
          "manufacturer_address",
          "net_quantity",
          "expiry_date",
          "ingredients",
          "model",
          "warranty_period",
          "screen_size",
          "storage",
          "ram",
          "dimensions",
          "weight",
          "dosage_form",
          "prescription_required",
          "composition",
          "side_effects",
          "cuisine",
          "course",
          "allergen_info",
          "serving_size",
          "power_consumption",
          "capacity",
          "energy_rating",
        ];

        attributeKeys.forEach((key) => {
          if (processedItem[key] !== undefined && processedItem.attributes) {
            processedItem.attributes[key] = processedItem[key];
            delete processedItem[key]; // Remove from root level
          }
        });

        // if (item.code && item.code.includes(":")) {
        //   const [type, ...valueParts] = item.code.split(":");
        //   processedItem.code_type = type;
        //   processedItem.code_value = valueParts.join(":");
        // }

        if (item.return_window) {
          const parsed = parseDuration(item.return_window);
          processedItem.return_window_unit = parsed.unit;
          processedItem.return_window_value = parsed.value;
        }

        if (item.replacement_window) {
          const parsed = parseDuration(item.replacement_window);
          processedItem.replacement_window_unit = parsed.unit;
          processedItem.replacement_window_value = parsed.value;
        }

        if (item.time_to_ship) {
          const parsed = parseDuration(item.time_to_ship);
          processedItem.time_to_ship_unit = parsed.unit;
          processedItem.time_to_ship_value = parsed.value;
        }

        return processedItem;
      }) || [
        {
          name: "",
          domain: "",
          code_type: "",
          code_value: "",
          symbol: "",
          short_desc: "",
          long_desc: "",
          images: "",
          unit: "",
          value: "",
          available_count: "",
          maximum_count: "",
          minimum_count: "",
          selling_price: "",
          mrp: "",
          currency: "INR",
          brand: "",
          category: "",
          menu_item: "",
          default_fulfillment_type: "Delivery",
          store: "",
          returnable: true,
          cancellable: true,
          return_window: " ",
          return_window_unit: "minute",
          return_window_value: " ",
          replacement_window: "",
          replacement_window_unit: "minute",
          replacement_window_value: "",
          time_to_ship: "",
          time_to_ship_unit: "minute",
          time_to_ship_value: "",
          cod_availability: false,
          consumer_care_name: "",
          consumer_care_email: "",
          consumer_care_contact: "",
          // Miscellaneous Details
          country_of_origin: "IND",
          veg_non_veg: "veg",
          back_image: "",
          refer_back_image: false,
          // Statutory Requirements - Packaged Commodities
          manufacturer_or_packer_name: "",
          manufacturer_or_packer_address: "",
          common_or_generic_name_of_commodity: "",
          net_quantity_or_measure_of_commodity_in_pkg: "",
          month_year_of_manufacture_packing_import: "",
          // Statutory Requirements - Prepackaged Food
          imported_product_country_of_origin: "",
          nutritional_info: "",
          additives_info: "",
          brand_owner_name: "",
          brand_owner_address: "",
          brand_owner_fssai_license_no: "",
          other_fssai_license_no: "",
          importer_name: "",
          importer_address: "",
          importer_fssai_license_no: "",
          // All dynamic attributes in a nested object
          attributes: {
            // Dynamic attributes will be added based on category selection
            gender: "",
            colour: "",
            size: "",
            size_chart: "",
            fabric: "",
            colour_name: "",
            // Additional common fashion attributes
            pattern: "",
            material: "",
            season: "",
            occasion: "",
            sleeve_length: "",
            collar: "",
            fit: "",
            neck: "",
            hemline: "",
            coverage: "",
            padding: "",
            closure_type: "",
            fasten_type: "",
            water_resistant: "",
            sport_type: "",
            material_finish: "",
            fabric_finish: "",
            // BPC attributes
            concern: "",
            ingredient: "",
            conscious: "",
            preference: "",
            formulation: "",
            skin_type: "",
            // Other domain attributes
            manufacturer: "",
            manufacturer_address: "",
            net_quantity: "",
            expiry_date: "",
            ingredients: "",
            model: "",
            warranty_period: "",
            screen_size: "",
            storage: "",
            ram: "",
            dimensions: "",
            weight: "",
            dosage_form: "",
            prescription_required: "",
            composition: "",
            side_effects: "",
            cuisine: "",
            course: "",
            allergen_info: "",
            serving_size: "",
            power_consumption: "",
            capacity: "",
            energy_rating: "",
          },
        },
      ]
    );
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      items: processInitialItems(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const updateIsoDuration = (
    index: number,
    field: string,
    unit: string,
    value: string
  ) => {
    const isoValue =
      unit === "day"
        ? `P${value}D`
        : `PT${value}${unit === "hour" ? "H" : "M"}`;
    setValue(`items.${index}.${field}` as any, isoValue);
  };

  const updateCode = (index: number, type: string, value: string) => {
    setValue(`items.${index}.code` as any, `${type}:${value}`);
  };

  const addItem = () => {
    // Get the domain from the first item if available
    const firstItemDomain = watchItems[0]?.domain || "";
    
    append({
      name: "",
      domain: firstItemDomain,
      code_type: firstItemDomain === "F&B" ? "" : "EAN",
      code_value: "",
      symbol: "",
      short_desc: "",
      long_desc: "",
      images: "",
      unit: "",
      value: "",
      available_count: "",
      maximum_count: "",
      minimum_count: "",
      selling_price: "",
      mrp: "",
      currency: "INR",
      brand: "",
      category: "",
      default_fulfillment_type: "Delivery",
      store: "",
      returnable: true,
      cancellable: true,
      return_window: "PT1H",
      return_window_unit: "hour",
      return_window_value: "1",
      replacement_window: "PT1H",
      replacement_window_unit: "hour",
      replacement_window_value: "1",
      time_to_ship: "PT45M",
      time_to_ship_unit: "minute",
      time_to_ship_value: "45",
      cod_availability: false,
      consumer_care_name: "",
      consumer_care_email: "",
      consumer_care_contact: "",
      // Miscellaneous Details
      country_of_origin: "",
      veg_non_veg: "",
      back_image: "",
      refer_back_image: false,
      // Statutory Requirements - Packaged Commodities
      manufacturer_or_packer_name: "",
      manufacturer_or_packer_address: "",
      common_or_generic_name_of_commodity: "",
      net_quantity_or_measure_of_commodity_in_pkg: "",
      month_year_of_manufacture_packing_import: "",
      // Statutory Requirements - Prepackaged Food
      imported_product_country_of_origin: "",
      nutritional_info: "",
      additives_info: "",
      brand_owner_name: "",
      brand_owner_address: "",
      brand_owner_fssai_license_no: "",
      other_fssai_license_no: "",
      importer_name: "",
      importer_address: "",
      importer_fssai_license_no: "",
      // All dynamic attributes in a nested object
      attributes: {
        // Dynamic attributes will be added based on category selection
        gender: "",
        colour: "",
        size: "",
        size_chart: "",
        fabric: "",
        colour_name: "",
        // Additional common fashion attributes
        pattern: "",
        material: "",
        season: "",
        occasion: "",
        sleeve_length: "",
        collar: "",
        fit: "",
        neck: "",
        hemline: "",
        coverage: "",
        padding: "",
        closure_type: "",
        fasten_type: "",
        water_resistant: "",
        sport_type: "",
        material_finish: "",
        fabric_finish: "",
        // BPC attributes
        concern: "",
        ingredient: "",
        conscious: "",
        preference: "",
        formulation: "",
        skin_type: "",
        // Other domain attributes
        manufacturer: "",
        manufacturer_address: "",
        net_quantity: "",
        expiry_date: "",
        ingredients: "",
        model: "",
        warranty_period: "",
        screen_size: "",
        storage: "",
        ram: "",
        dimensions: "",
        weight: "",
        dosage_form: "",
        prescription_required: "",
        composition: "",
        side_effects: "",
        cuisine: "",
        course: "",
        allergen_info: "",
        serving_size: "",
        power_consumption: "",
        capacity: "",
        energy_rating: "",
      },
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("At least one item is required");
    }
  };

  const onSubmit = (data: FormData) => {
    // Prepare items with their variants
    const itemsWithVariants = data.items.map((item, index) => {
      const variants = itemVariants[index] || [];
      return {
        ...item,
        variants: variants,
      };
    });

    const finalData = {
      ...data,
      items: itemsWithVariants,
    };

    onNext(finalData);
    toast.success("Item details saved successfully!");
  };
  // Variant functions
  const getAvailableAttributesForVariants = (itemIndex: number) => {
    const item = watchItems[itemIndex];
    if (!item?.attributes) return [];

    // Get all non-empty attributes from the item that can be used for variants
    const availableAttrs = Object.entries(item.attributes)
      .filter(([_key, value]) => value && value !== "")
      .map(([key]) => key);

    return availableAttrs;
  };

  const getAttributePredefinedValues = (
    domain: string,
    category: string,
    attributeName: string
  ): string[] => {
    try {
      const categoryConfig = getCategoryConfig(domain, category);
      if (!categoryConfig || typeof categoryConfig !== "object") {
        return [];
      }

      const attributeConfig =
        categoryConfig[attributeName as keyof typeof categoryConfig];
      if (!attributeConfig || typeof attributeConfig !== "object") {
        return [];
      }

      // Type guard to check if attributeConfig has a 'value' property
      const config = attributeConfig as {
        value?: unknown;
        mandatory?: boolean;
      };

      if (Array.isArray(config.value) && config.value.length > 0) {
        // Ensure all values are strings
        return config.value.filter(
          (val) => typeof val === "string"
        ) as string[];
      }

      return [];
    } catch (error) {
      console.warn(
        `Error getting predefined values for ${domain}/${category}/${attributeName}:`,
        error
      );
      return [];
    }
  };

  const handleCreateVariants = (itemIndex: number) => {
    const item = watchItems[itemIndex];
    const selectedAttrs = selectedVariantAttributes[itemIndex] || [];
    const values = variantValues[itemIndex] || {};

    if (selectedAttrs.length === 0) {
      toast.error("Please select at least one attribute for variants");
      return;
    }

    // Check if all selected attributes have values
    for (const attr of selectedAttrs) {
      if (!values[attr] || values[attr].length === 0) {
        toast.error(
          `Please provide at least one value for ${attr.replace(/_/g, " ")}`
        );
        return;
      }
    }

    // Calculate total combinations that will be created
    const totalCombinations = selectedAttrs.reduce((total, attr) => {
      return total * (values[attr]?.length || 1);
    }, 1);

    // Allow variants even with single values - the key is having variant attributes defined
    if (totalCombinations === 0) {
      toast.error(
        "No valid combinations found. Please check your attribute values."
      );
      return;
    }

    // Generate all combinations of variant values
    const generateCombinations = (
      attrs: string[],
      index: number = 0
    ): any[] => {
      if (index >= attrs.length) {
        return [{}];
      }

      const attr = attrs[index];
      const attrValues = values[attr] || [];
      const remainingCombinations = generateCombinations(attrs, index + 1);

      const combinations: any[] = [];
      for (const value of attrValues) {
        for (const combo of remainingCombinations) {
          combinations.push({
            ...combo,
            [attr]: value,
          });
        }
      }

      return combinations;
    };

    const combinations = generateCombinations(selectedAttrs);

    // Check for duplicate combinations
    const existingVariants = itemVariants[itemIndex] || [];
    const existingCombinations = existingVariants.map((v) =>
      JSON.stringify(v.variantCombination)
    );

    const newCombinations = combinations.filter((combo) => {
      const comboKey = JSON.stringify(combo);
      return !existingCombinations.includes(comboKey);
    });

    if (newCombinations.length === 0) {
      toast.error(
        "All these variant combinations already exist. Please select different attribute values."
      );
      return;
    }

    if (newCombinations.length < combinations.length) {
      const duplicateCount = combinations.length - newCombinations.length;
      toast.warning(
        `${duplicateCount} duplicate variant(s) skipped. Creating ${newCombinations.length} new variant(s).`
      );
    }

    // Get existing variant count to ensure unique IDs
    const existingVariantCount = existingVariants.length;

    // Create variant items based on new combinations
    const variants = newCombinations.map((combo, idx) => {
      const variantItem = {
        ...item,
        attributes: {
          ...item.attributes,
          ...combo,
        },
        variantOf: itemIndex,
        variantId: `${itemIndex}-${existingVariantCount + idx}`,
        variantCombination: combo,
        isVariant: true,
      };

      // Keep the same name as parent item - variant details are in attributes
      variantItem.name = item.name;

      return variantItem;
    });

    setItemVariants((prev) => ({
      ...prev,
      [itemIndex]: [...(prev[itemIndex] || []), ...variants],
    }));

    setShowVariantModal((prev) => ({
      ...prev,
      [itemIndex]: false,
    }));

    // Clear variant values for this item
    setVariantValues((prev) => ({
      ...prev,
      [itemIndex]: {},
    }));

    const variantText = variants.length === 1 ? "variant" : "variants";
    const existingCount = itemVariants[itemIndex]?.length || 0;
    const totalVariants = existingCount + variants.length;
    const actionText = existingCount > 0 ? "Added" : "Created";
    toast.success(
      `${actionText} ${variants.length} new ${variantText} for ${item.name}. Total: ${totalVariants} variants. Each will appear as a separate catalog item.`
    );
  };

  const removeVariant = (itemIndex: number, variantIndex: number) => {
    setItemVariants((prev) => ({
      ...prev,
      [itemIndex]: prev[itemIndex].filter((_, idx) => idx !== variantIndex),
    }));
  };

  const openEditVariantModal = (itemIndex: number, variantIndex: number) => {
    const variant = itemVariants[itemIndex][variantIndex];
    setEditingVariant(variant);
    setEditVariantModal({
      visible: true,
      itemIndex,
      variantIndex,
    });
    
    // Set form initial values
    variantForm.setFieldsValue({
      name: variant.name,
      short_desc: variant.short_desc || variant.shortDescription,
      long_desc: variant.long_desc || variant.longDescription,
      selling_price: variant.selling_price,
      mrp: variant.mrp,
      code_value: variant.code_value,
      code_type: variant.code_type,
      images: variant.images,
      symbol: variant.symbol,
      unit: variant.unit,
      value: variant.value,
      available_count: variant.available_count,
      maximum_count: variant.maximum_count,
      minimum_count: variant.minimum_count,
      ...variant.variantCombination,
      ...variant.attributes,
    });
  };

  const handleSaveVariant = () => {
    variantForm.validateFields().then((values) => {
      const { itemIndex, variantIndex } = editVariantModal;
      if (itemIndex === null || variantIndex === null) return;

      const currentVariant = itemVariants[itemIndex][variantIndex];
      
      // Define which fields are main fields (not attributes)
      const mainFields = ['name', 'short_desc', 'long_desc', 'selling_price', 'mrp', 
                         'code_value', 'code_type', 'images', 'symbol', 'unit', 'value',
                         'available_count', 'maximum_count', 'minimum_count'];
      
      // Start with the current variant data
      const updatedVariant = {
        ...currentVariant,
      };
      
      // Update main fields from form values
      mainFields.forEach(field => {
        if (values[field] !== undefined) {
          updatedVariant[field] = values[field];
        }
      });
      
      // Preserve existing attributes and update with new attribute values
      const attributeUpdates: any = {};
      Object.keys(values).forEach(key => {
        if (!mainFields.includes(key)) {
          attributeUpdates[key] = values[key];
        }
      });
      
      // Merge attributes, preserving existing ones and updating with new values
      if (Object.keys(attributeUpdates).length > 0) {
        updatedVariant.attributes = {
          ...currentVariant.attributes,
          ...attributeUpdates,
        };
      }
      
      // Preserve variantCombination if it exists and update its values
      if (currentVariant.variantCombination) {
        const variantCombinationUpdates: any = {};
        Object.keys(currentVariant.variantCombination).forEach(key => {
          if (values[key] !== undefined) {
            variantCombinationUpdates[key] = values[key];
          } else {
            variantCombinationUpdates[key] = currentVariant.variantCombination[key];
          }
        });
        updatedVariant.variantCombination = variantCombinationUpdates;
      }

      // Update the variant in state
      setItemVariants((prev) => ({
        ...prev,
        [itemIndex]: prev[itemIndex].map((v, idx) =>
          idx === variantIndex ? updatedVariant : v
        ),
      }));

      // Close modal and reset
      setEditVariantModal({
        visible: false,
        itemIndex: null,
        variantIndex: null,
      });
      setEditingVariant(null);
      variantForm.resetFields();
      
      toast.success("Variant updated successfully");
    }).catch((error) => {
      console.error("Validation failed:", error);
      toast.error("Please fill in all required fields");
    });
  };

  const handleCancelEditVariant = () => {
    setEditVariantModal({
      visible: false,
      itemIndex: null,
      variantIndex: null,
    });
    setEditingVariant(null);
    variantForm.resetFields();
  };

  // Consumer Care functions
  const getFirstItemConsumerCare = () => {
    const firstItem = watchItems[0];
    if (
      firstItem &&
      firstItem.consumer_care_name &&
      firstItem.consumer_care_email &&
      firstItem.consumer_care_contact
    ) {
      return {
        name: firstItem.consumer_care_name,
        email: firstItem.consumer_care_email,
        contact: firstItem.consumer_care_contact,
      };
    }
    return null;
  };

  const handleConsumerCareToggle = (itemIndex: number, checked: boolean) => {
    setUseExistingConsumerCare((prev) => ({
      ...prev,
      [itemIndex]: checked,
    }));

    if (checked) {
      const firstItemConsumerCare = getFirstItemConsumerCare();
      if (firstItemConsumerCare) {
        setValue(
          `items.${itemIndex}.consumer_care_name`,
          firstItemConsumerCare.name
        );
        setValue(
          `items.${itemIndex}.consumer_care_email`,
          firstItemConsumerCare.email
        );
        setValue(
          `items.${itemIndex}.consumer_care_contact`,
          firstItemConsumerCare.contact
        );
      }
    } else {
      // Clear the fields when unchecked
      setValue(`items.${itemIndex}.consumer_care_name`, "");
      setValue(`items.${itemIndex}.consumer_care_email`, "");
      setValue(`items.${itemIndex}.consumer_care_contact`, "");
    }
  };

  function getProtocolKeysByCategory(category: string): string[] {
    const mapping = categoryProtocolMappings.find(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );

    return mapping?.protocolKeys || [];
  }

  // Function to get categories based on selected domain
  function getCategoriesByDomain(domain: string): string[] {
    const domainConfig = domainCategories.find(
      (item) => item.domain === domain
    );
    return domainConfig?.categories || [];
  }
  // Function to get category configuration based on domain
  const getCategoryConfig = (domain: string, subcategory: string) => {
    // For Fashion domain, use the detailed fashion configuration
    if (domain === "Fashion" && fashion[subcategory as keyof typeof fashion]) {
      return fashion[subcategory as keyof typeof fashion];
    }

    // For BPC domain
    if (domain === "BPC" && BPCJSON[subcategory as keyof typeof BPCJSON]) {
      return BPCJSON[subcategory as keyof typeof BPCJSON];
    }

    // For Electronics domain
    if (
      domain === "Electronics" &&
      electronicsData[subcategory as keyof typeof electronicsData]
    ) {
      return electronicsData[subcategory as keyof typeof electronicsData];
    }

    // For Health & Wellness domain
    if (
      domain === "Health & Wellness" &&
      health[subcategory as keyof typeof health]
    ) {
      return health[subcategory as keyof typeof health];
    }

    // For Home & Kitchen domain
    if (
      domain === "Home & Kitchen" &&
      homeJSON[subcategory as keyof typeof homeJSON]
    ) {
      return homeJSON[subcategory as keyof typeof homeJSON];
    }

    // For Appliances domain
    if (
      domain === "Appliances" &&
      applianceData[subcategory as keyof typeof applianceData]
    ) {
      return applianceData[subcategory as keyof typeof applianceData];
    }

    // For F&B domain
    if (domain === "F&B") {
      const fnbConfig = getFnBAttributes(subcategory);
      return {
        ...fnbConfig.mandatory,
        ...fnbConfig.optional,
      };
    }

    // Default configuration for other domains
    return {
      brand: {
        mandatory: false,
        value: [],
      },
    };
  };

  // Function to get mandatory attributes for a subcategory
  const getMandatoryAttributes = (domain: string, subcategory: string) => {
    const categoryConfig = getCategoryConfig(domain, subcategory);

    if (!categoryConfig || Object.keys(categoryConfig).length === 0) {
      return {};
    }

    const mandatoryOnly = Object.fromEntries(
      Object.entries(categoryConfig).filter(
        ([_, config]: [string, any]) => config.mandatory === true
      )
    );
    return mandatoryOnly;
  };

  // Function to get optional attributes for a subcategory
  const getOptionalAttributes = (domain: string, subcategory: string) => {
    const categoryConfig = getCategoryConfig(domain, subcategory);
    if (!categoryConfig || Object.keys(categoryConfig).length === 0) {
      return {};
    }

    const optionalOnly = Object.fromEntries(
      Object.entries(categoryConfig).filter(
        ([_, config]: [string, any]) => config.mandatory === false
      )
    );
    return optionalOnly;
  };

  // Function to get smart placeholder for attributes
  const getAttributePlaceholder = (attributeName: string): string => {
    const attrLower = attributeName.toLowerCase();

    // Weight related attributes
    if (
      attrLower.includes("weight") ||
      attrLower === "net_weight" ||
      attrLower === "gross_weight"
    ) {
      return `Enter ${attributeName.replace(/_/g, " ")} in grams (e.g., 500)`;
    }

    // Dimension related attributes
    if (
      attrLower.includes("height") ||
      attrLower.includes("width") ||
      attrLower.includes("breadth") ||
      attrLower.includes("length") ||
      attrLower.includes("depth") ||
      attrLower.includes("thickness")
    ) {
      return `Enter ${attributeName.replace(/_/g, " ")} in cm (e.g., 25)`;
    }

    // Size/dimensions combined
    if (attrLower === "dimensions" || attrLower === "size_dimensions") {
      return "Enter dimensions in cm (L x W x H, e.g., 30 x 20 x 10)";
    }

    // Volume/Capacity
    if (attrLower.includes("capacity") || attrLower.includes("volume")) {
      return `Enter ${attributeName.replace(
        /_/g,
        " "
      )} in liters or ml (e.g., 1.5L or 500ml)`;
    }

    // Power/Energy
    if (attrLower.includes("power") || attrLower.includes("wattage")) {
      return `Enter ${attributeName.replace(/_/g, " ")} in watts (e.g., 1500)`;
    }

    // Screen size
    if (attrLower === "screen_size" || attrLower === "display_size") {
      return "Enter screen size in inches (e.g., 15.6)";
    }

    // Storage/Memory
    if (
      attrLower === "storage" ||
      attrLower === "memory" ||
      attrLower === "ram"
    ) {
      return `Enter ${attributeName.replace(
        /_/g,
        " "
      )} (e.g., 8GB, 256GB, 1TB)`;
    }

    // Battery
    if (attrLower.includes("battery")) {
      return "Enter battery capacity in mAh (e.g., 5000)";
    }

    // Price/Cost
    if (
      attrLower.includes("price") ||
      attrLower.includes("cost") ||
      attrLower === "mrp"
    ) {
      return `Enter ${attributeName.replace(/_/g, " ")} in INR (e.g., 999)`;
    }

    // Quantity
    if (attrLower === "net_quantity" || attrLower === "quantity") {
      return "Enter quantity with unit (e.g., 500g, 1kg, 2L, 10 pieces)";
    }

    // Warranty
    if (attrLower.includes("warranty")) {
      return "Enter warranty period (e.g., 1 year, 6 months)";
    }

    // Expiry/Shelf life
    if (attrLower.includes("expiry") || attrLower.includes("shelf_life")) {
      return "Enter date in DD/MM/YYYY format or duration (e.g., 6 months)";
    }

    // Color specific
    if (attrLower === "colour" || attrLower === "color") {
      return "Please add hexadecimal color code (e.g., #FF5733)";
    }

    // Material
    if (attrLower === "material" || attrLower === "fabric") {
      return `Enter ${attributeName.replace(
        /_/g,
        " "
      )} (e.g., Cotton, Polyester, Steel)`;
    }

    // Size (clothing/shoes)
    if (attrLower === "size" && !attrLower.includes("screen")) {
      return "Enter size (e.g., S, M, L, XL, 42, 8)";
    }

    // Model/SKU
    if (
      attrLower === "model" ||
      attrLower === "model_number" ||
      attrLower === "sku"
    ) {
      return `Enter ${attributeName.replace(/_/g, " ")} (e.g., ABC-123-XYZ)`;
    }

    // Ingredients
    if (attrLower === "ingredients" || attrLower === "composition") {
      return "Enter ingredients/composition separated by commas";
    }

    // Nutritional
    if (
      attrLower.includes("calories") ||
      attrLower.includes("protein") ||
      attrLower.includes("carbs")
    ) {
      return `Enter ${attributeName.replace(/_/g, " ")} per 100g/100ml`;
    }

    // Temperature
    if (attrLower.includes("temperature") || attrLower === "temp") {
      return "Enter temperature in °C (e.g., 25)";
    }

    // Speed/Frequency
    if (attrLower.includes("speed") || attrLower === "rpm") {
      return "Enter speed in RPM or km/h";
    }

    // Voltage
    if (attrLower.includes("voltage")) {
      return "Enter voltage in V (e.g., 220V)";
    }

    // Resolution
    if (attrLower.includes("resolution")) {
      return "Enter resolution (e.g., 1920x1080, 4K, Full HD)";
    }

    // Connectivity
    if (attrLower.includes("connectivity") || attrLower === "interface") {
      return "Enter connectivity type (e.g., WiFi, Bluetooth, USB-C)";
    }

    // Age
    if (attrLower.includes("age_group") || attrLower === "age") {
      return "Enter age group (e.g., 3-5 years, Adult, Kids)";
    }

    // Gender
    if (attrLower === "gender") {
      return "Enter gender (e.g., Male, Female, Unisex)";
    }

    // Country
    if (attrLower === "country_of_origin" || attrLower === "origin") {
      return "Enter country code or name (e.g., IND, India)";
    }

    // Dosage
    if (attrLower.includes("dosage")) {
      return "Enter dosage (e.g., 500mg, 2 tablets daily)";
    }

    // Percentage
    if (attrLower.includes("percentage") || attrLower.includes("purity")) {
      return `Enter ${attributeName.replace(/_/g, " ")} in % (e.g., 99.9)`;
    }

    // Default
    return `Enter ${attributeName.replace(/_/g, " ")}`;
  };

  // Function to render dynamic attribute field
  const renderAttributeField = (
    attributeName: string,
    config: any,
    itemIndex: number,
    isOptional: boolean = false
  ) => {
    const fieldName = `items.${itemIndex}.attributes.${attributeName}` as any;
    const isSelectField =
      Array.isArray(config.value) && config.value.length > 0;
    const isValidationField =
      typeof config.value === "string" && config.value.startsWith("/");

    return (
      <div key={attributeName}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {attributeName
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
          {!isOptional && "*"}
        </label>
        <Controller
          name={fieldName}
          control={control}
          rules={{
            ...(!isOptional && {
              required: `${attributeName.replace(/_/g, " ")} is required`,
            }),
            ...(isValidationField && {
              pattern: {
                value: new RegExp(config.value.slice(1, -1)), // Remove leading and trailing '/'
                message: `Please enter a valid ${attributeName.replace(
                  /_/g,
                  " "
                )}`,
              },
            }),
          }}
          render={({ field, fieldState: { error } }) => (
            <>
              {isSelectField ? (
                <Select
                  {...field}
                  className="w-full"
                  size="large"
                  placeholder={`Select ${attributeName.replace(/_/g, " ")}`}
                  status={error ? "error" : undefined}
                  allowClear={isOptional}
                >
                  {config.value.map((option: string) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Input
                  {...field}
                  placeholder={getAttributePlaceholder(attributeName)}
                  size="large"
                  status={error ? "error" : undefined}
                />
              )}
              {error && (
                <p className="text-red-500 text-xs mt-1">{error.message}</p>
              )}
            </>
          )}
        />
      </div>
    );
  };

  // Function to handle optional attribute selection
  const handleOptionalAttributeChange = (
    itemIndex: number,
    selectedAttributes: string[]
  ) => {
    const previouslySelected = selectedOptionalAttributes[itemIndex] || [];
    const deselectedAttributes = previouslySelected.filter(
      (attr) => !selectedAttributes.includes(attr)
    );

    // Clear form values for deselected attributes
    deselectedAttributes.forEach((attrName) => {
      setValue(`items.${itemIndex}.${attrName}` as any, "");
    });

    setSelectedOptionalAttributes((prev) => ({
      ...prev,
      [itemIndex]: selectedAttributes,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Item Details</h2>
        <p className="text-gray-600">
          Add your product/service items with detailed information
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-gray-50 rounded-lg p-6 border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <FaBox className="text-blue-500" />
                Item {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={fields.length === 1}
              >
                <FaMinus />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Description</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <Controller
                      name={`items.${index}.name`}
                      control={control}
                      rules={{ required: "Name is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="Enter Item Name"
                            size="large"
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain *
                    </label>
                    <Controller
                      name={`items.${index}.domain`}
                      control={control}
                      rules={{ required: "Domain is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Domain"
                            allowClear
                            status={error ? "error" : undefined}
                            onChange={(value) => {
                              field.onChange(value);
                              // Clear category when domain changes
                              setValue(`items.${index}.category` as any, "");
                              // Clear selected optional attributes when domain changes
                              setSelectedOptionalAttributes((prev) => ({
                                ...prev,
                                [index]: [],
                              }));
                            }}
                          >
                            {initialData?.domain?.map((domain) => (
                              <Select.Option key={domain} value={domain}>
                                {domain}
                              </Select.Option>
                            ))}
                          </Select>
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* Item Code - Hide for F&B domain */}
                  {watchItems[index]?.domain !== "F&B" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Code *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Code Type *
                          </label>
                          <Controller
                            name={`items.${index}.code_type`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                className="w-full"
                                size="large"
                                placeholder="Select Code Type"
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                              >
                                <Select.Option value="EAN">EAN</Select.Option>
                                <Select.Option value="ISBN">ISBN</Select.Option>
                                <Select.Option value="GTIN">GTIN</Select.Option>
                                <Select.Option value="HSN">HSN</Select.Option>
                                <Select.Option value="Others">
                                  Others
                                </Select.Option>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Code Value *
                          </label>
                          <Controller
                            name={`items.${index}.code_value`}
                            control={control}
                            rules={{ required: watchItems[index]?.domain !== "F&B" ? "Code value is required" : false }}
                            render={({ field, fieldState: { error } }) => (
                              <>
                                <Input
                                  {...field}
                                  placeholder="Enter Code Value"
                                  size="large"
                                  status={error ? "error" : undefined}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    const codeType =
                                      watchItems[index]?.code_type || "EAN";
                                    updateCode(index, codeType, e.target.value);
                                  }}
                                />
                                {error && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {error.message}
                                  </p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol URL *
                    </label>
                    <Controller
                      name={`items.${index}.symbol`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="url"
                          placeholder="Enter Symbol Image URL"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images URL *
                    </label>
                    <Controller
                      name={`items.${index}.images`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="url"
                          placeholder="Enter Item Images URL"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description *
                    </label>
                    <Controller
                      name={`items.${index}.short_desc`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter Short Description"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long Description *
                    </label>
                    <Controller
                      name={`items.${index}.long_desc`}
                      control={control}
                      render={({ field }) => (
                        <Input.TextArea
                          {...field}
                          placeholder="Enter Detailed Description"
                          rows={3}
                          size="large"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Quantity</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <Controller
                      name={`items.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Unit"
                        >
                          <Select.Option value="unit">Unit</Select.Option>
                          <Select.Option value="dozen">Dozen</Select.Option>
                          <Select.Option value="gram">Gram</Select.Option>
                          <Select.Option value="litre">Litre</Select.Option>
                          <Select.Option value="millilitre">
                            Millilitre
                          </Select.Option>
                          <Select.Option value="kilogram">
                            Kilogram
                          </Select.Option>
                          <Select.Option value="tonne">Tonne</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value *
                    </label>
                    <Controller
                      name={`items.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter Quantity Value"
                          size="large"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability *
                    </label>
                    <Controller
                      name={`items.${index}.available_count`}
                      control={control}
                      rules={{ required: "Availability is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Availability"
                          >
                            <Select.Option value="99">Available</Select.Option>
                            <Select.Option value="0">
                              Not Available
                            </Select.Option>
                          </Select>

                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Count *
                    </label>
                    <Controller
                      name={`items.${index}.maximum_count`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter Maximum Count"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Count *
                    </label>
                    <Controller
                      name={`items.${index}.minimum_count`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter Minimum Count"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Price</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price *
                    </label>
                    <Controller
                      name={`items.${index}.selling_price`}
                      control={control}
                      rules={{ required: "Selling price is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Enter Selling Price"
                            size="large"
                            min={0}
                            status={error ? "error" : undefined}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP *
                    </label>
                    <Controller
                      name={`items.${index}.mrp`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter MRP"
                          size="large"
                          min={0}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency *
                    </label>
                    <Controller
                      name={`items.${index}.currency`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Currency"
                        >
                          <Select.Option value="INR">INR</Select.Option>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">
                  Additional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store *
                    </label>
                    <Controller
                      name={`items.${index}.store`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Store"
                          allowClear
                          onChange={(value) => {
                            field.onChange(value);
                            setValue(`items.${index}.category` as any, "");
                          }}
                        >
                          {initialData?.stores?.map((store) => (
                            <Select.Option
                              value={store.locality}
                              key={store.locality}
                            >
                              {store.locality}
                            </Select.Option>
                          ))}
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <Controller
                      name={`items.${index}.category`}
                      control={control}
                      rules={{ required: "Category is required" }}
                      render={({ field, fieldState: { error } }) => {
                        const selectedStore = watchItems[index]?.store;
                        const selectedDomain = watchItems[index]?.domain;
                        const store = initialData?.stores?.find(
                          (s) => s.locality === selectedStore
                        );

                        // Get categories based on selected domain
                        const domainCategoriesList = selectedDomain
                          ? getCategoriesByDomain(selectedDomain)
                          : [];

                        // Get store supported subcategories
                        const storeSubcategories =
                          store?.supported_subcategories || [];

                        // Filter to show only categories that are both in the domain and supported by the store
                        let subcategories = [];

                        if (selectedDomain && domainCategoriesList.length > 0) {
                          // If domain is selected, filter store categories by domain categories
                          if (storeSubcategories.length > 0) {
                            subcategories = domainCategoriesList.filter((cat) =>
                              storeSubcategories.some(
                                (storeCat) =>
                                  storeCat.toLowerCase() === cat.toLowerCase()
                              )
                            );
                          } else {
                            // If no store categories, use all domain categories
                            subcategories = domainCategoriesList;
                          }
                        } else {
                          // If no domain selected, use store categories
                          subcategories = storeSubcategories;
                        }


                        return (
                          <>
                            <Select
                              {...field}
                              className="w-full"
                              size="large"
                              placeholder={
                                !selectedStore
                                  ? "Please Select A Store First"
                                  : !selectedDomain
                                  ? "Please Select A Domain First"
                                  : subcategories.length === 0
                                  ? "No categories available"
                                  : "Select Category"
                              }
                              disabled={
                                !selectedStore ||
                                !selectedDomain ||
                                subcategories.length === 0
                              }
                              status={error ? "error" : undefined}
                              onChange={(value) => {
                                field.onChange(value);
                                setSelectedSubCategory(value);
                                // Clear selected optional attributes when category changes
                                setSelectedOptionalAttributes((prev) => ({
                                  ...prev,
                                  [index]: [],
                                }));
                              }}
                            >
                              {subcategories.length === 0 && selectedStore ? (
                                <Select.Option value="" disabled>
                                  No categories available for this store
                                </Select.Option>
                              ) : (
                                subcategories.map((category) => (
                                  <Select.Option
                                    value={category}
                                    key={category}
                                  >
                                    {category}
                                  </Select.Option>
                                ))
                              )}
                            </Select>
                            {error && (
                              <p className="text-red-500 text-xs mt-1">
                                {error.message}
                              </p>
                            )}
                          </>
                        );
                      }}
                    />
                  </div>

                  {/* Menu Selection for F&B Domain */}
                  {watchItems[index]?.domain === "F&B" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link to Menu Item
                      </label>
                      <Controller
                        name={`items.${index}.menu_item`}
                        control={control}
                        render={({ field, fieldState: { error } }) => {
                          const availableMenus = initialData.menuItems || [];

                          return (
                            <>
                              <Select
                                {...field}
                                className="w-full"
                                size="large"
                                placeholder={
                                  availableMenus.length === 0
                                    ? "No menus available - Create menus in Custom Menu step first"
                                    : "Select a menu item to link (optional)"
                                }
                                allowClear
                                disabled={availableMenus.length === 0}
                                status={error ? "error" : undefined}
                              >
                                {availableMenus.map((menu, menuIndex) => (
                                  <Select.Option
                                    value={menu.name}
                                    key={menuIndex}
                                  >
                                    {menu.name} - {menu.category} (
                                    {menu.vegNonVeg})
                                  </Select.Option>
                                ))}
                              </Select>
                              {availableMenus.length === 0 && (
                                <p className="text-amber-600 text-xs mt-1">
                                  💡 Create menu items in the Custom Menu step
                                  to link them with items here
                                </p>
                              )}
                              {error && (
                                <p className="text-red-500 text-xs mt-1">
                                  {error.message}
                                </p>
                              )}
                            </>
                          );
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Fulfillment Type *
                    </label>
                    <Controller
                      name={`items.${index}.default_fulfillment_type`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Fulfillment Type"
                        >
                          <Select.Option value="Delivery">
                            Delivery
                          </Select.Option>
                          <Select.Option value="Self-Pickup">
                            Self-Pickup
                          </Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Window *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.return_window_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.return_window_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.return_window_unit || "hour";
                              updateIsoDuration(
                                index,
                                "return_window",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Replacement Window *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.replacement_window_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Replacement Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                              const numValue =
                                watchItems[index]?.replacement_window_value ||
                                "1";
                              updateIsoDuration(
                                index,
                                "replacement_window",
                                value,
                                numValue
                              );
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.replacement_window_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.replacement_window_unit ||
                                "hour";
                              updateIsoDuration(
                                index,
                                "replacement_window",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time to Ship *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Controller
                        name={`items.${index}.time_to_ship_unit`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            className="w-full"
                            size="large"
                            placeholder="Select Shipping Time Unit"
                            onChange={(value) => {
                              field.onChange(value);
                              const numValue =
                                watchItems[index]?.time_to_ship_value || "45";
                              updateIsoDuration(
                                index,
                                "time_to_ship",
                                value,
                                numValue
                              );
                            }}
                          >
                            <Select.Option value="minute">
                              Minutes
                            </Select.Option>
                            <Select.Option value="hour">Hours</Select.Option>
                            <Select.Option value="day">Days</Select.Option>
                          </Select>
                        )}
                      />
                      <Controller
                        name={`items.${index}.time_to_ship_value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            placeholder="Value"
                            size="large"
                            min={1}
                            onChange={(e) => {
                              field.onChange(e);
                              const unit =
                                watchItems[index]?.time_to_ship_unit ||
                                "minute";
                              updateIsoDuration(
                                index,
                                "time_to_ship",
                                unit,
                                e.target.value
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Returnable *
                    </label>
                    <Controller
                      name={`items.${index}.returnable`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellable *
                    </label>
                    <Controller
                      name={`items.${index}.cancellable`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CoD Availability *
                    </label>
                    <Controller
                      name={`items.${index}.cod_availability`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          value={field.value ? "yes" : "no"}
                          onChange={(value) => field.onChange(value === "yes")}
                          className="w-full"
                          size="large"
                          placeholder="Select option"
                        >
                          <Select.Option value="yes">Yes</Select.Option>
                          <Select.Option value="no">No</Select.Option>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const selectedCategory = watchItems[index]?.category || "";
                const protocolKeys =
                  getProtocolKeysByCategory(selectedCategory);

                if (protocolKeys.length === 0) return null;

                const hasPackaged = protocolKeys.includes(
                  "@ondc/org/statutory_reqs_packaged_commodities"
                );
                const hasPrepackaged = protocolKeys.includes(
                  "@ondc/org/statutory_reqs_prepackaged_food"
                );

                const referBackImage =
                  watchItems[index]?.refer_back_image || false;

                return (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Statutory Requirements ({selectedCategory})
                    </h4>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refer Back Image
                      </label>
                      <Controller
                        name={`items.${index}.refer_back_image`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value ? "yes" : "no"}
                            onChange={(value) =>
                              field.onChange(value === "yes")
                            }
                            className="w-full"
                            size="large"
                            placeholder="Select option"
                          >
                            <Select.Option value="yes">Yes</Select.Option>
                            <Select.Option value="no">No</Select.Option>
                          </Select>
                        )}
                      />
                      {referBackImage && (
                        <p className="text-sm text-blue-600 mt-1">
                          When referring to back image, statutory requirements
                          are not needed.
                        </p>
                      )}
                    </div>

                    {!referBackImage && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasPackaged && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer or Packer Name
                              </label>
                              <Controller
                                name={`items.${index}.manufacturer_or_packer_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Manufacturer Or Packer Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer or Packer Address
                              </label>
                              <Controller
                                name={`items.${index}.manufacturer_or_packer_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Manufacturer Or Packer Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Common or Generic Name of Commodity
                              </label>
                              <Controller
                                name={`items.${index}.common_or_generic_name_of_commodity`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Common Or Generic Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Net Quantity or Measure
                              </label>
                              <Controller
                                name={`items.${index}.net_quantity_or_measure_of_commodity_in_pkg`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="e.g., 500g, 1L"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month and Year of Manufacture
                              </label>
                              <Controller
                                name={`items.${index}.month_year_of_manufacture_packing_import`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="e.g., 10/2024"
                                    size="large"
                                    type="date"
                                  />
                                )}
                              />
                            </div>
                          </>
                        )}

                        {hasPrepackaged && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imported Product Country of Origin
                              </label>
                              <Controller
                                name={`items.${index}.imported_product_country_of_origin`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Country Of Origin"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nutritional Info
                              </label>
                              <Controller
                                name={`items.${index}.nutritional_info`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Nutritional Information"
                                    rows={3}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additives Info
                              </label>
                              <Controller
                                name={`items.${index}.additives_info`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Additives Information"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner Name
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Brand Owner Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner Address
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Brand Owner Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand Owner FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.brand_owner_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter FSSAI License Number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Other FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.other_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter other FSSAI license number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer Name
                              </label>
                              <Controller
                                name={`items.${index}.importer_name`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Importer Name"
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer Address
                              </label>
                              <Controller
                                name={`items.${index}.importer_address`}
                                control={control}
                                render={({ field }) => (
                                  <Input.TextArea
                                    {...field}
                                    placeholder="Enter Importer Address"
                                    rows={2}
                                    size="large"
                                  />
                                )}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Importer FSSAI License No
                              </label>
                              <Controller
                                name={`items.${index}.importer_fssai_license_no`}
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Enter Importer FSSAI License Number"
                                    size="large"
                                  />
                                )}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">
                  Miscellaneous Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country of Origin
                    </label>
                    <Controller
                      name={`items.${index}.country_of_origin`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          className="w-full"
                          size="large"
                          placeholder="Select Country"
                          showSearch
                          filterOption={(input, option) =>
                            (option?.key ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={countries}
                        />
                      )}
                    />
                  </div>

                  {(watchItems[index]?.domain === "Grocery" ||
                    watchItems[index]?.domain === "F&B") && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Veg/NonVeg
                        </label>
                        <Controller
                          name={`items.${index}.veg_non_veg`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              className="w-full"
                              size="large"
                              placeholder="Select type"
                              allowClear
                            >
                              <Select.Option value="veg">Veg</Select.Option>
                              <Select.Option value="non-veg">
                                Non-Veg
                              </Select.Option>
                            </Select>
                          )}
                        />
                      </div>
                      {watchItems[index]?.domain === "Grocery" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Back Image URL
                          </label>
                          <Controller
                            name={`items.${index}.back_image`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="url"
                                placeholder="Enter back image URL"
                                size="large"
                              />
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Consumer Care Section */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Consumer Care</h4>
                  {index > 0 && getFirstItemConsumerCare() && (
                    <Checkbox
                      checked={useExistingConsumerCare[index] || false}
                      onChange={(e) =>
                        handleConsumerCareToggle(index, e.target.checked)
                      }
                    >
                      Use same as first item
                    </Checkbox>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter consumer care name"
                          size="large"
                          disabled={useExistingConsumerCare[index] || false}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_email`}
                      control={control}
                      rules={{
                        required: useExistingConsumerCare[index]
                          ? false
                          : "Consumer care email is required",
                        pattern: useExistingConsumerCare[index]
                          ? undefined
                          : {
                              value:
                                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                              message: "Please enter a valid email address",
                            },
                        validate: useExistingConsumerCare[index]
                          ? undefined
                          : {
                              validEmail: (value: string | undefined) => {
                                if (!value) return true;
                                const email = value.toLowerCase();
                                if (email.includes(".."))
                                  return "Email cannot contain consecutive dots";
                                if (
                                  email.startsWith(".") ||
                                  email.endsWith(".")
                                )
                                  return "Email cannot start or end with a dot";
                                if (email.split("@")[0].length > 64)
                                  return "Local part of email is too long";
                                return true;
                              },
                            },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter consumer care email"
                            size="large"
                            status={error ? "error" : undefined}
                            disabled={useExistingConsumerCare[index] || false}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact No.
                    </label>
                    <Controller
                      name={`items.${index}.consumer_care_contact`}
                      control={control}
                      rules={{
                        required: useExistingConsumerCare[index]
                          ? false
                          : "Contact number is required",
                        pattern: useExistingConsumerCare[index]
                          ? undefined
                          : {
                              value: /^[+]?[1-9][0-9]{9,14}$/,
                              message:
                                "Please enter a valid contact number (10-15 digits)",
                            },
                        validate: useExistingConsumerCare[index]
                          ? undefined
                          : {
                              validPhone: (value: string | undefined) => {
                                if (!value) return true;
                                // Remove spaces and hyphens for validation
                                const phone = value.replace(/[\s-]/g, "");
                                // Indian phone number validation
                                if (phone.startsWith("+91")) {
                                  if (phone.length !== 13)
                                    return "Indian number with +91 must be 13 digits total";
                                  const numberPart = phone.substring(3);
                                  if (!/^[6-9][0-9]{9}$/.test(numberPart))
                                    return "Indian mobile numbers must start with 6-9";
                                } else if (phone.length === 10) {
                                  if (!/^[6-9][0-9]{9}$/.test(phone))
                                    return "Indian mobile numbers must start with 6-9";
                                } else if (!phone.startsWith("+")) {
                                  return "Please enter 10 digit number or include country code with +";
                                }
                                return true;
                              },
                            },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="Enter contact number (e.g., 9876543210 or +919876543210)"
                            size="large"
                            maxLength={15}
                            status={error ? "error" : undefined}
                            disabled={useExistingConsumerCare[index] || false}
                          />
                          {error && (
                            <p className="text-red-500 text-xs mt-1">
                              {error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
              {(() => {
                const selectedCategory = watchItems[index]?.category || "";
                const selectedDomain = watchItems[index]?.domain || "";
                const mandatoryAttributes = getMandatoryAttributes(
                  selectedDomain,
                  selectedCategory
                );
                const optionalAttributes = getOptionalAttributes(
                  selectedDomain,
                  selectedCategory
                );
                const selectedOptionals =
                  selectedOptionalAttributes[index] || [];

                if (
                  Object.keys(mandatoryAttributes).length === 0 &&
                  Object.keys(optionalAttributes).length === 0
                ) {
                  return (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Attributes
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand
                          </label>
                          <Controller
                            name={`items.${index}.brand`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                placeholder="Enter brand name"
                                size="large"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Attributes ({selectedCategory})
                    </h4>

                    {/* Mandatory Attributes */}
                    {Object.keys(mandatoryAttributes).length > 0 && (
                      <>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">
                          Required Attributes *
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {Object.entries(mandatoryAttributes).map(
                            ([attributeName, config]) =>
                              renderAttributeField(
                                attributeName,
                                config,
                                index,
                                false
                              )
                          )}
                        </div>
                      </>
                    )}

                    {/* Optional Attributes Selection */}
                    {Object.keys(optionalAttributes).length > 0 && (
                      <>
                        <h5 className="text-sm font-medium text-gray-600 mb-2">
                          Additional Optional Attributes
                        </h5>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Additional Attributes (Optional)
                          </label>
                          <Select
                            mode="multiple"
                            className="w-full"
                            size="large"
                            placeholder="Choose optional attributes to add"
                            value={selectedOptionals}
                            onChange={(values) =>
                              handleOptionalAttributeChange(index, values)
                            }
                            allowClear
                          >
                            {Object.keys(optionalAttributes).map(
                              (attributeName) => (
                                <Select.Option
                                  key={attributeName}
                                  value={attributeName}
                                >
                                  {attributeName
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Select.Option>
                              )
                            )}
                          </Select>
                        </div>

                        {/* Render Selected Optional Attributes */}
                        {selectedOptionals.length > 0 && (
                          <>
                            <h5 className="text-sm font-medium text-gray-600 mb-2">
                              Selected Optional Attributes
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {selectedOptionals.map((attributeName) => {
                                const config =
                                  optionalAttributes[attributeName];
                                return renderAttributeField(
                                  attributeName,
                                  config,
                                  index,
                                  true
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Variants Section - Not shown for F&B domain */}
            {watchItems[index]?.domain === "F&B" ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">
                    F&B Customizations
                  </h4>
                  <p className="text-sm text-blue-800">
                    For F&B items, customizations and add-ons are configured in
                    the Custom Menu step. Variants are not applicable for food
                    items.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-700">Variants</h4>
                  <Button
                    type="default"
                    onClick={() => {
                      setShowVariantModal((prev) => ({
                        ...prev,
                        [index]: true,
                      }));
                    }}
                    disabled={!getAvailableAttributesForVariants(index).length}
                  >
                    {itemVariants[index] && itemVariants[index].length > 0
                      ? "Add More Variants"
                      : "Create Variants"}
                  </Button>
                </div>

                {/* Display existing variants */}
                {itemVariants[index] && itemVariants[index].length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">
                        Created Variants ({itemVariants[index].length})
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Each variant will appear as a separate item in your
                        catalog
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {itemVariants[index].map((variant, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 mb-2">
                                {variant.name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                Variant Attributes:
                              </p>
                              <div className="space-y-1">
                                {Object.entries(
                                  variant.variantCombination || {}
                                ).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-gray-600 capitalize">
                                      {key.replace(/_/g, " ")}:
                                    </span>
                                    <span className="font-medium text-gray-800">
                                      {String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-blue-600">
                                Catalog Item ID: I{vIdx + 1}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditVariantModal(index, vIdx)
                                }
                                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                title="View/Edit variant"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariant(index, vIdx)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Remove variant"
                              >
                                <FaMinus className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
                      <strong>Note:</strong> Each variant above will be created
                      as an individual item in your product catalog. Customers
                      can discover and purchase each variant independently based
                      on their specific attribute preferences.
                    </div>
                  </div>
                )}

                {!getAvailableAttributesForVariants(index).length && (
                  <p className="text-sm text-gray-500">
                    Add attributes to this item to create variants
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={addItem}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
          >
            <FaPlus />
            Add Another Item
          </button>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            Previous
          </button>
          <LoadingButton
            type="submit"
            buttonText="Next"
            isLoading={isSubmitting}
          />
        </div>
      </form>

      {/* Variant Creation Modals */}
      {fields.map((_field, index) => (
        <Modal
          key={`variant-modal-${index}`}
          title={`${
            itemVariants[index] && itemVariants[index].length > 0
              ? "Add More Variants for"
              : "Create Variants for"
          } ${watchItems[index]?.name || `Item ${index + 1}`}`}
          open={showVariantModal[index] || false}
          onCancel={() => {
            setShowVariantModal((prev) => ({
              ...prev,
              [index]: false,
            }));
            setSelectedVariantAttributes((prev) => ({
              ...prev,
              [index]: [],
            }));
          }}
          onOk={() => handleCreateVariants(index)}
          width={600}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select which attributes you want to vary for this item. Each
                variant will inherit all properties from the parent item but
                differ in the selected attributes. You can create variants with
                just one attribute and value, or use multiple attributes with
                various combinations.
                {itemVariants[index] && itemVariants[index].length > 0 && (
                  <span className="block mt-2 text-blue-600 font-medium">
                    This item already has {itemVariants[index].length}{" "}
                    variant(s). You can add more variants with different
                    attributes.
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Variant Attributes *
              </label>
              <Select
                mode="multiple"
                className="w-full"
                size="large"
                placeholder="Choose attributes that will differ in variants"
                value={selectedVariantAttributes[index] || []}
                onChange={(values) => {
                  setSelectedVariantAttributes((prev) => ({
                    ...prev,
                    [index]: values,
                  }));
                }}
                allowClear
              >
                {getAvailableAttributesForVariants(index).map((attr) => (
                  <Select.Option key={attr} value={attr}>
                    {attr
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Select.Option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Each selected attribute can have one or more values. Variants
                will be created for all possible combinations. Examples: "color"
                alone with 3 values = 3 variants, or "color" (2 values) + "size"
                (3 values) = 6 variants.
              </p>
            </div>

            {selectedVariantAttributes[index] &&
              selectedVariantAttributes[index].length > 0 && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      Provide values for each variant attribute:
                    </h4>
                    {selectedVariantAttributes[index].map((attr) => {
                      const item = watchItems[index];
                      const predefinedValues =
                        item?.domain && item?.category
                          ? getAttributePredefinedValues(
                              item.domain,
                              item.category,
                              attr
                            )
                          : [];
                      const hasPredefinedValues =
                        Array.isArray(predefinedValues) &&
                        predefinedValues.length > 0;

                      return (
                        <div key={attr}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {attr
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                            Values
                            {hasPredefinedValues && (
                              <span className="text-xs text-blue-600 ml-2">
                                (Select from predefined values or add custom)
                              </span>
                            )}
                          </label>
                          <Select
                            mode="tags"
                            className="w-full"
                            size="large"
                            placeholder={
                              hasPredefinedValues
                                ? `Select from list or type custom ${attr} values`
                                : `Enter ${attr} values (press Enter after each)`
                            }
                            value={variantValues[index]?.[attr] || []}
                            onChange={(values) => {
                              setVariantValues((prev) => ({
                                ...prev,
                                [index]: {
                                  ...prev[index],
                                  [attr]: values,
                                },
                              }));
                            }}
                            allowClear
                          >
                            {hasPredefinedValues &&
                              predefinedValues.map((value: string) => (
                                <Select.Option key={value} value={value}>
                                  {value}
                                </Select.Option>
                              ))}
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {hasPredefinedValues
                              ? "Select from predefined options or type custom values. Even a single value will create a variant."
                              : "Add values for this attribute. Each value will create a separate variant, even with just one value."}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {variantValues[index] &&
                    Object.keys(variantValues[index]).length > 0 && (
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-700 mb-1">
                          Preview:{" "}
                          {(() => {
                            const counts = selectedVariantAttributes[index].map(
                              (attr) =>
                                variantValues[index]?.[attr]?.length || 0
                            );
                            const total = counts.reduce(
                              (a, b) => a * b || 1,
                              1
                            );
                            return total;
                          })()}{" "}
                          variant(s) will be created
                        </p>
                        <p className="text-xs text-blue-600">
                          Combinations based on your input values
                        </p>
                      </div>
                    )}
                </>
              )}
          </div>
        </Modal>
      ))}

      {/* Edit Variant Modal */}
      <Modal
        title="View/Edit Variant Details"
        open={editVariantModal.visible}
        onOk={handleSaveVariant}
        onCancel={handleCancelEditVariant}
        width={800}
        okText="Save Changes"
        cancelText="Cancel"
      >
        {editingVariant && (
          <Form
            form={variantForm}
            layout="vertical"
            className="max-h-[600px] overflow-y-auto"
          >
            {/* Basic Information Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Item Name"
                  name="name"
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input placeholder="Enter item name" />
                </Form.Item>

                {/* Hide Code Type and Code Value for F&B domain */}
                {editVariantModal.itemIndex !== null && 
                 watchItems[editVariantModal.itemIndex]?.domain !== "F&B" && (
                  <>
                    <Form.Item
                      label="Code Type"
                      name="code_type"
                      rules={[{ required: true, message: "Code type is required" }]}
                    >
                      <Select placeholder="Select code type">
                        <Select.Option value="EAN">EAN</Select.Option>
                        <Select.Option value="ISBN">ISBN</Select.Option>
                        <Select.Option value="GTIN">GTIN</Select.Option>
                        <Select.Option value="HSN">HSN</Select.Option>
                        <Select.Option value="Others">Others</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Code Value"
                      name="code_value"
                      rules={[
                        { required: true, message: "Code value is required" },
                      ]}
                    >
                      <Input placeholder="Enter code value" />
                    </Form.Item>
                  </>
                )}

                <Form.Item
                  label="Images URL"
                  name="images"
                  rules={[
                    { required: true, message: "Image URL is required" },
                    { type: "url", message: "Please enter a valid URL" },
                  ]}
                >
                  <Input type="url" placeholder="Enter image URL" />
                </Form.Item>

                <Form.Item label="Symbol/Icon URL" name="symbol">
                  <Input type="url" placeholder="Enter symbol URL" />
                </Form.Item>
              </div>
            </div>

            {/* Descriptions Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Descriptions
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Form.Item
                  label="Short Description"
                  name="short_desc"
                  rules={[
                    {
                      required: true,
                      message: "Short description is required",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Enter short description"
                  />
                </Form.Item>

                <Form.Item
                  label="Long Description"
                  name="long_desc"
                  rules={[
                    { required: true, message: "Long description is required" },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter long description"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Selling Price (₹)"
                  name="selling_price"
                  rules={[
                    { required: true, message: "Selling price is required" },
                  ]}
                >
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter selling price"
                  />
                </Form.Item>

                <Form.Item
                  label="MRP (₹)"
                  name="mrp"
                  rules={[{ required: true, message: "MRP is required" }]}
                >
                  <Input type="number" step="0.01" placeholder="Enter MRP" />
                </Form.Item>
              </div>
            </div>

            {/* Quantity Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                Quantity & Units
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Unit" name="unit">
                  <Select placeholder="Select unit">
                    <Select.Option value="unit">Unit</Select.Option>
                    <Select.Option value="kg">Kilogram</Select.Option>
                    <Select.Option value="g">Gram</Select.Option>
                    <Select.Option value="l">Liter</Select.Option>
                    <Select.Option value="ml">Milliliter</Select.Option>
                    <Select.Option value="dozen">Dozen</Select.Option>
                    <Select.Option value="pack">Pack</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Value" name="value">
                  <Input placeholder="Enter value (e.g., 1, 500)" />
                </Form.Item>

                <Form.Item label="Available Count" name="available_count">
                  <Input type="number" placeholder="Enter available quantity" />
                </Form.Item>

                <Form.Item label="Maximum Count" name="maximum_count">
                  <Input
                    type="number"
                    placeholder="Enter maximum order quantity"
                  />
                </Form.Item>

                <Form.Item label="Minimum Count" name="minimum_count">
                  <Input
                    type="number"
                    placeholder="Enter minimum order quantity"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Variant Attributes Section */}
            {editingVariant?.variantCombination && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  Variant Attributes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(editingVariant.variantCombination).map(
                    ([key]) => (
                      <Form.Item
                        key={key}
                        label={
                          key.replace(/_/g, " ").charAt(0).toUpperCase() +
                          key.replace(/_/g, " ").slice(1)
                        }
                        name={key}
                      >
                        <Input placeholder={`Enter ${key}`} />
                      </Form.Item>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Additional Attributes Section */}
            {editingVariant?.attributes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  Additional Attributes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(editingVariant.attributes)
                    .filter(
                      ([key]) => !editingVariant.variantCombination?.[key]
                    )
                    .filter(
                      ([key]) =>
                        ![
                          "name",
                          "short_desc",
                          "long_desc",
                          "selling_price",
                          "mrp",
                          "code_value",
                          "code_type",
                          "images",
                          "symbol",
                          "unit",
                          "value",
                          "available_count",
                          "maximum_count",
                          "minimum_count",
                        ].includes(key)
                    )
                    .map(([key]) => (
                      <Form.Item
                        key={key}
                        label={
                          key.replace(/_/g, " ").charAt(0).toUpperCase() +
                          key.replace(/_/g, " ").slice(1)
                        }
                        name={key}
                      >
                        <Input placeholder={`Enter ${key}`} />
                      </Form.Item>
                    ))}
                </div>
              </div>
            )}

            {/* Read-only Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                System Information
              </h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Variant ID:</span>{" "}
                    <span className="text-gray-600">
                      {editingVariant?.variantId}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Parent Item Index:</span>{" "}
                    <span className="text-gray-600">
                      {editingVariant?.variantOf}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Is Variant:</span>{" "}
                    <span className="text-gray-600">
                      {editingVariant?.isVariant ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ItemDetailsForm;
