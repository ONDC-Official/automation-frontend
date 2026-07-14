import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller, Path } from "react-hook-form";
import { toast } from "sonner";
import { FaPlus, FaTrash, FaBox, FaEdit } from "react-icons/fa";
import { SelectControl } from "@components/Shadcn/Select";
import { ComboBoxMultiControl, ComboBoxControl } from "@components/Shadcn/ComboBox";
import { Input } from "@components/Shadcn/Input";
import { Textarea } from "@/components/Shadcn/TextArea/text-area";
import { Checkbox } from "@components/Shadcn/Checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    ConfirmDialog,
} from "@components/Shadcn/Dialog";
import { Button } from "@components/Shadcn/Button";
import Spinner from "@components/Shadcn/Spinner";
import TagsInput from "@components/Forms/tags-input";
import MultiImageUpload from "@components/Forms/multi-image-upload";
import SingleImageUpload from "@components/Forms/single-image-upload";
import { useFormImageState } from "@hooks/useImageUpload";
import { countries } from "@constants/common";
import { LabelWithToolTip } from "@components/Shadcn/TextField/label-with-tooltip";
import type {
    AttributeConfig,
    FormData,
    ItemDetailsFormProps,
    ItemVariant,
} from "@pages/seller-onboarding/item-details-form/types";
import {
    ATTRIBUTE_MIGRATION_KEYS,
    YES_NO_OPTIONS,
    createEmptyAttributes,
} from "@pages/seller-onboarding/item-details-form/constants";
import {
    generateVariantCombinations,
    parseDuration,
} from "@pages/seller-onboarding/item-details-form/variant-utils";
import {
    getAttributePlaceholder,
    getAttributePredefinedValues,
    getCategoriesByDomain,
    getMandatoryAttributes,
    getOptionalAttributes,
    getProtocolKeysByCategory,
} from "@pages/seller-onboarding/item-details-form/attribute-config";

const ItemDetailsForm: React.FC<ItemDetailsFormProps> = ({ initialData, onNext, onPrevious }) => {
    // const [selectedSubCategory, setSelectedSubCategory] = useState("");
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
        [itemIndex: number]: ItemVariant[];
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
    const [editingVariant, setEditingVariant] = useState<ItemVariant | null>(null);
    const [pendingRemoveVariant, setPendingRemoveVariant] = useState<{
        itemIndex: number;
        variantIndex: number;
    } | null>(null);
    const initialVariantFormValuesRef = useRef<Record<string, string>>({});
    const [isEditVariantConfirmOpen, setIsEditVariantConfirmOpen] = useState(false);
    const [pendingCloseCreateVariantIndex, setPendingCloseCreateVariantIndex] = useState<
        number | null
    >(null);
    const [variantFormValues, setVariantFormValues] = useState<Record<string, string>>({});
    const [variantFormErrors, setVariantFormErrors] = useState<Record<string, string>>({});
    const updateVariantField = (key: string, value: string) => {
        setVariantFormValues((prev) => ({ ...prev, [key]: value }));
    };

    // Use optimized hooks for image state management
    const itemImages = useFormImageState<{ [itemIndex: number]: string[] }>({});
    const symbolImages = useFormImageState<{ [itemIndex: number]: string }>({});
    const backImages = useFormImageState<{ [itemIndex: number]: string }>({});
    const variantImages = useFormImageState<{ [key: string]: string[] }>({});
    const variantSymbolImages = useFormImageState<{ [key: string]: string }>({});

    const processInitialItems = () => {
        return (
            initialData.items?.map((item) => {
                const processedItem = { ...item };

                // Ensure attributes object exists
                if (!processedItem.attributes) {
                    processedItem.attributes = {};
                }

                // Migrate any existing attributes from root level to attributes object
                ATTRIBUTE_MIGRATION_KEYS.forEach((key) => {
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

                // Handle images field - convert from string to array if needed
                if (typeof item.images === "string") {
                    processedItem.images = item.images ? [item.images] : [];
                } else if (Array.isArray(item.images)) {
                    processedItem.images = item.images;
                } else {
                    processedItem.images = [];
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
                    images: [],
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
                    attributes: createEmptyAttributes(),
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
        reset,
    } = useForm<FormData>({
        defaultValues: {
            items: processInitialItems(),
        },
    });

    // Reset form when initialData changes (when navigating back)
    useEffect(() => {
        reset({
            items: processInitialItems(),
        });

        // Reset state variables based on initialData
        if (initialData.items) {
            // Reset selected optional attributes for each item
            const newOptionalAttributes: { [itemIndex: number]: string[] } = {};
            const newConsumerCareState: { [itemIndex: number]: boolean } = {};
            const newVariantState: { [itemIndex: number]: boolean } = {};
            const newVariantAttributes: { [itemIndex: number]: string[] } = {};
            const newItemVariants: { [itemIndex: number]: ItemVariant[] } = {};
            const newVariantValues: { [itemIndex: number]: { [attribute: string]: string[] } } = {};
            const newItemImageUrls: { [itemIndex: number]: string[] } = {};
            const newSymbolImageUrls: { [itemIndex: number]: string } = {};

            initialData.items.forEach((item, index) => {
                // You can customize this logic based on how you want to restore state
                newOptionalAttributes[index] = []; // Reset to empty, or load from item data if stored
                newConsumerCareState[index] = false;
                newVariantState[index] = false;
                newVariantAttributes[index] = [];
                newItemVariants[index] = [];
                newVariantValues[index] = {};

                // Initialize image state from item data
                if (Array.isArray(item.images)) {
                    newItemImageUrls[index] = item.images;
                } else if (typeof item.images === "string" && item.images) {
                    newItemImageUrls[index] = [item.images];
                } else {
                    newItemImageUrls[index] = [];
                }

                newSymbolImageUrls[index] = item.symbol || "";
            });

            setSelectedOptionalAttributes(newOptionalAttributes);
            setUseExistingConsumerCare(newConsumerCareState);
            setShowVariantModal(newVariantState);
            setSelectedVariantAttributes(newVariantAttributes);
            setItemVariants(newItemVariants);
            setVariantValues(newVariantValues);
            itemImages.resetImageState(newItemImageUrls);
            symbolImages.resetImageState(newSymbolImageUrls);
        }
    }, [initialData, reset]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchItems = watch("items");

    const updateIsoDuration = (index: number, field: string, unit: string, value: string) => {
        const isoValue = unit === "day" ? `P${value}D` : `PT${value}${unit === "hour" ? "H" : "M"}`;
        setValue(`items.${index}.${field}` as Path<FormData>, isoValue);
    };

    const updateCode = (index: number, type: string, value: string) => {
        setValue(`items.${index}.code` as Path<FormData>, `${type}:${value}`);
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
            images: [],
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
            attributes: createEmptyAttributes(),
        });
    };

    const removeItem = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        } else {
            toast.error("At least one item is required");
        }
    };

    const onSubmit = async (data: FormData) => {
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

        await onNext(finalData);
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
                toast.error(`Please provide at least one value for ${attr.replace(/_/g, " ")}`);
                return;
            }
        }

        // Calculate total combinations that will be created
        const totalCombinations = selectedAttrs.reduce((total, attr) => {
            return total * (values[attr]?.length || 1);
        }, 1);

        // Allow variants even with single values - the key is having variant attributes defined
        if (totalCombinations === 0) {
            toast.error("No valid combinations found. Please check your attribute values.");
            return;
        }

        // Generate all combinations of variant values
        const combinations = generateVariantCombinations(selectedAttrs, values);

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
        const variants: ItemVariant[] = newCombinations.map((combo, idx) => {
            const variantItem: ItemVariant = {
                ...item,
                attributes: {
                    ...item.attributes,
                    ...combo,
                },
                variantOf: itemIndex,
                variantId: `${itemIndex}-${existingVariantCount + idx}`,
                variantCombination: combo,
                isVariant: true as const,
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

        // Initialize variant image URLs using hooks
        const variantKey = `${itemIndex}-${variantIndex}`;
        const currentVariantImages = Array.isArray(variant.images)
            ? variant.images
            : variant.images
              ? [variant.images]
              : [];
        variantImages.updateImageField(variantKey, currentVariantImages);

        if (variant.symbol) {
            variantSymbolImages.updateImageField(variantKey, variant.symbol);
        }

        // Set form initial values
        const initialValues = {
            name: variant.name ?? "",
            short_desc:
                variant.short_desc ||
                (variant as unknown as Record<string, string>).shortDescription ||
                "",
            long_desc:
                variant.long_desc ||
                (variant as unknown as Record<string, string>).longDescription ||
                "",
            selling_price: variant.selling_price ?? "",
            mrp: variant.mrp ?? "",
            code_value: variant.code_value ?? "",
            code_type: variant.code_type ?? "",
            unit: variant.unit ?? "",
            value: variant.value ?? "",
            available_count: variant.available_count ?? "",
            maximum_count: variant.maximum_count ?? "",
            minimum_count: variant.minimum_count ?? "",
            ...variant.variantCombination,
            ...variant.attributes,
        };
        setVariantFormValues(initialValues);
        initialVariantFormValuesRef.current = initialValues;
        setVariantFormErrors({});
    };

    const handleSaveVariant = () => {
        const { itemIndex, variantIndex } = editVariantModal;
        if (itemIndex === null || variantIndex === null) return;

        const isFnBDomain = watchItems[itemIndex]?.domain === "F&B";
        const values = variantFormValues;

        const errors: Record<string, string> = {};
        if (!values.name?.trim()) errors.name = "Name is required";
        if (!isFnBDomain && !values.code_type?.trim()) errors.code_type = "Code type is required";
        if (!isFnBDomain && !values.code_value?.trim())
            errors.code_value = "Code value is required";
        if (!values.short_desc?.trim()) errors.short_desc = "Short description is required";
        if (!values.long_desc?.trim()) errors.long_desc = "Long description is required";
        if (!values.selling_price?.toString().trim())
            errors.selling_price = "Selling price is required";
        if (!values.mrp?.toString().trim()) errors.mrp = "MRP is required";

        if (Object.keys(errors).length > 0) {
            setVariantFormErrors(errors);
            toast.error("Please fill in all required fields");
            return;
        }

        const currentVariant = itemVariants[itemIndex][variantIndex];

        // Define which fields are main fields (not attributes)
        const mainFields = [
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
        ];

        // Start with the current variant data
        const updatedVariant = {
            ...currentVariant,
        };

        // Update main fields from form values
        mainFields.forEach((field) => {
            if (values[field] !== undefined) {
                updatedVariant[field] = values[field];
            }
        });

        // Handle images from MultiImageUpload using hooks
        const variantKey = `${itemIndex}-${variantIndex}`;
        if (variantImages.imageState[variantKey]) {
            updatedVariant.images = variantImages.imageState[variantKey];
        }

        // Handle symbol from SingleImageUpload using hooks
        if (variantSymbolImages.imageState[variantKey]) {
            updatedVariant.symbol = variantSymbolImages.imageState[variantKey];
        }

        // Preserve existing attributes and update with new attribute values
        const attributeUpdates: Record<string, string> = {};
        Object.keys(values).forEach((key) => {
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
            const variantCombinationUpdates: Record<string, string> = {};
            Object.keys(currentVariant.variantCombination).forEach((key) => {
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
        setVariantFormValues({});
        setVariantFormErrors({});

        toast.success("Variant updated successfully");
    };

    const handleCancelEditVariant = () => {
        setEditVariantModal({
            visible: false,
            itemIndex: null,
            variantIndex: null,
        });
        setEditingVariant(null);
        setVariantFormValues({});
        setVariantFormErrors({});
    };

    const isEditVariantDirty = () =>
        JSON.stringify(variantFormValues) !== JSON.stringify(initialVariantFormValuesRef.current);

    const requestCloseEditVariant = () => {
        if (isEditVariantDirty()) {
            setIsEditVariantConfirmOpen(true);
            return;
        }
        handleCancelEditVariant();
    };

    const closeCreateVariantModal = (index: number) => {
        setShowVariantModal((prev) => ({
            ...prev,
            [index]: false,
        }));
        setSelectedVariantAttributes((prev) => ({
            ...prev,
            [index]: [],
        }));
    };

    const requestCloseCreateVariantModal = (index: number) => {
        if ((selectedVariantAttributes[index] ?? []).length > 0) {
            setPendingCloseCreateVariantIndex(index);
            return;
        }
        closeCreateVariantModal(index);
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
                setValue(`items.${itemIndex}.consumer_care_name`, firstItemConsumerCare.name);
                setValue(`items.${itemIndex}.consumer_care_email`, firstItemConsumerCare.email);
                setValue(`items.${itemIndex}.consumer_care_contact`, firstItemConsumerCare.contact);
            }
        } else {
            // Clear the fields when unchecked
            setValue(`items.${itemIndex}.consumer_care_name`, "");
            setValue(`items.${itemIndex}.consumer_care_email`, "");
            setValue(`items.${itemIndex}.consumer_care_contact`, "");
        }
    };

    // Function to render dynamic attribute field
    const renderAttributeField = (
        attributeName: string,
        config: AttributeConfig,
        itemIndex: number,
        isOptional: boolean = false
    ) => {
        const fieldName = `items.${itemIndex}.attributes.${attributeName}` as Path<FormData>;
        const isSelectField = Array.isArray(config.value) && config.value.length > 0;
        const isValidationField = typeof config.value === "string" && config.value.startsWith("/");

        return (
            <div key={attributeName}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {attributeName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
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
                                value: new RegExp((config.value as string).slice(1, -1)), // Remove leading and trailing '/'
                                message: `Please enter a valid ${attributeName.replace(/_/g, " ")}`,
                            },
                        }),
                    }}
                    render={({ field, fieldState: { error } }) => (
                        <>
                            {isSelectField && Array.isArray(config.value) ? (
                                <SelectControl
                                    value={field.value as string | undefined}
                                    onValueChange={field.onChange}
                                    options={config.value.map((option: string) => ({
                                        key: option,
                                        value: option,
                                    }))}
                                    placeholder={`Select ${attributeName.replace(/_/g, " ")}`}
                                    className={error ? "border-destructive" : undefined}
                                />
                            ) : (
                                <Input
                                    {...field}
                                    value={field.value as string}
                                    placeholder={getAttributePlaceholder(attributeName)}
                                    aria-invalid={!!error}
                                />
                            )}
                            {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
                        </>
                    )}
                />
            </div>
        );
    };

    // Function to handle optional attribute selection
    const handleOptionalAttributeChange = (itemIndex: number, selectedAttributes: string[]) => {
        const previouslySelected = selectedOptionalAttributes[itemIndex] || [];
        const deselectedAttributes = previouslySelected.filter(
            (attr) => !selectedAttributes.includes(attr)
        );

        // Clear form values for deselected attributes
        deselectedAttributes.forEach((attrName) => {
            setValue(`items.${itemIndex}.${attrName}` as Path<FormData>, "");
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
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeItem(index)}
                                className="h-auto text-red-500 hover:text-red-700 p-1"
                                disabled={fields.length === 1}
                            >
                                <FaTrash />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <h4 className="font-medium text-gray-700 mb-3">Description</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Name"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.name`}
                                            control={control}
                                            rules={{ required: "Name is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter Item Name"
                                                        aria-invalid={!!error}
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Domain"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.domain`}
                                            control={control}
                                            rules={{ required: "Domain is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <>
                                                    <SelectControl
                                                        value={field.value}
                                                        options={(initialData?.domain ?? []).map(
                                                            (domain) => ({
                                                                key: domain,
                                                                value: domain,
                                                            })
                                                        )}
                                                        placeholder="Select Domain"
                                                        className={
                                                            error ? "border-destructive" : undefined
                                                        }
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            // Clear category when domain changes
                                                            setValue(
                                                                `items.${index}.category` as Path<FormData>,
                                                                ""
                                                            );
                                                            // Clear selected optional attributes when domain changes
                                                            setSelectedOptionalAttributes(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [index]: [],
                                                                })
                                                            );
                                                            toast.info(
                                                                "Category and attribute selections were reset because Domain changed"
                                                            );
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

                                    {/* Item Code - Hide for F&B domain */}
                                    {watchItems[index]?.domain !== "F&B" && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Item Code
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <LabelWithToolTip
                                                        labelInfo={""}
                                                        label={"Code Type"}
                                                        required={true}
                                                    />

                                                    <Controller
                                                        name={`items.${index}.code_type`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <SelectControl
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                options={[
                                                                    { key: "EAN", value: "EAN" },
                                                                    { key: "ISBN", value: "ISBN" },
                                                                    { key: "GTIN", value: "GTIN" },
                                                                    { key: "HSN", value: "HSN" },
                                                                    {
                                                                        key: "Others",
                                                                        value: "Others",
                                                                    },
                                                                ]}
                                                                placeholder="Select Code Type"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <LabelWithToolTip
                                                        labelInfo={""}
                                                        label={"Code Value"}
                                                        required={true}
                                                    />

                                                    <Controller
                                                        name={`items.${index}.code_value`}
                                                        control={control}
                                                        rules={{
                                                            required:
                                                                watchItems[index]?.domain !== "F&B"
                                                                    ? "Code value is required"
                                                                    : false,
                                                        }}
                                                        render={({
                                                            field,
                                                            fieldState: { error },
                                                        }) => (
                                                            <>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Enter Code Value"
                                                                    aria-invalid={!!error}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        const codeType =
                                                                            watchItems[index]
                                                                                ?.code_type ||
                                                                            "EAN";
                                                                        updateCode(
                                                                            index,
                                                                            codeType,
                                                                            e.target.value
                                                                        );
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

                                    <div className="md:col-span-2">
                                        <SingleImageUpload
                                            label="Symbol/Icon"
                                            labelInfo="Upload a symbol or icon for this item"
                                            required={true}
                                            folder="workbench-seller-onboarding"
                                            value={symbolImages.imageState[index] || ""}
                                            onChange={(url) => {
                                                symbolImages.updateImageField(index, url);
                                                setValue(`items.${index}.symbol`, url);
                                            }}
                                            previewSize="small"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <MultiImageUpload
                                            label="Item Images"
                                            labelInfo="Upload multiple images for this item"
                                            required={true}
                                            folder="workbench-seller-onboarding"
                                            value={itemImages.imageState[index] || []}
                                            onChange={(urls) => {
                                                itemImages.updateImageField(index, urls);
                                                setValue(`items.${index}.images`, urls);
                                            }}
                                            maxFiles={8}
                                            previewSize="small"
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Short Description"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.short_desc`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter Short Description"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Long Description"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.long_desc`}
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter Detailed Description"
                                                    rows={3}
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Unit"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.unit`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={[
                                                        { key: "Unit", value: "unit" },
                                                        { key: "Dozen", value: "dozen" },
                                                        { key: "Gram", value: "gram" },
                                                        { key: "Litre", value: "litre" },
                                                        { key: "Millilitre", value: "millilitre" },
                                                        { key: "Kilogram", value: "kilogram" },
                                                        { key: "Tonne", value: "tonne" },
                                                    ]}
                                                    placeholder="Select Unit"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Value"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.value`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter Quantity Value"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Availability"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.available_count`}
                                            control={control}
                                            rules={{ required: "Availability is required" }}
                                            render={({ field, fieldState: { error } }) => (
                                                <>
                                                    <SelectControl
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        options={[
                                                            { key: "Available", value: "99" },
                                                            { key: "Not Available", value: "0" },
                                                        ]}
                                                        placeholder="Select Availability"
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Maximum Count"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.maximum_count`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter Maximum Count"
                                                    min={0}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Minimum Count"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.minimum_count`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter Minimum Count"
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Selling Price"}
                                            required={true}
                                        />

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
                                                        min={0}
                                                        aria-invalid={!!error}
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"MRP"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.mrp`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter MRP"
                                                    min={0}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Currency"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.currency`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={[{ key: "INR", value: "INR" }]}
                                                    placeholder="Select Currency"
                                                />
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Store"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.store`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value}
                                                    options={(initialData?.stores ?? [])
                                                        .filter((store) => !!store.locality)
                                                        .map((store) => ({
                                                            key: store.locality as string,
                                                            value: store.locality as string,
                                                        }))}
                                                    placeholder="Select Store"
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setValue(
                                                            `items.${index}.category` as Path<FormData>,
                                                            ""
                                                        );
                                                        toast.info(
                                                            "Category selection was reset because Store changed"
                                                        );
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Category"}
                                            required={true}
                                        />

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

                                                if (
                                                    selectedDomain &&
                                                    domainCategoriesList.length > 0
                                                ) {
                                                    // If domain is selected, filter store categories by domain categories
                                                    if (storeSubcategories.length > 0) {
                                                        subcategories = domainCategoriesList.filter(
                                                            (cat) =>
                                                                storeSubcategories.some(
                                                                    (storeCat) =>
                                                                        storeCat.toLowerCase() ===
                                                                        cat.toLowerCase()
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
                                                        <SelectControl
                                                            value={field.value}
                                                            options={subcategories.map(
                                                                (category) => ({
                                                                    key: category,
                                                                    value: category,
                                                                })
                                                            )}
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
                                                            className={
                                                                error
                                                                    ? "border-destructive"
                                                                    : undefined
                                                            }
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                // Clear selected optional attributes when category changes
                                                                setSelectedOptionalAttributes(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [index]: [],
                                                                    })
                                                                );
                                                            }}
                                                        />
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
                                                    const availableMenus =
                                                        initialData.menuItems || [];

                                                    return (
                                                        <>
                                                            <SelectControl
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                options={availableMenus.map(
                                                                    (menu) => ({
                                                                        key: `${menu.name} - ${menu.category} (${menu.vegNonVeg})`,
                                                                        value: menu.name,
                                                                    })
                                                                )}
                                                                placeholder={
                                                                    availableMenus.length === 0
                                                                        ? "No menus available - Create menus in Custom Menu step first"
                                                                        : "Select a menu item to link (optional)"
                                                                }
                                                                disabled={
                                                                    availableMenus.length === 0
                                                                }
                                                                className={
                                                                    error
                                                                        ? "border-destructive"
                                                                        : undefined
                                                                }
                                                            />
                                                            {availableMenus.length === 0 && (
                                                                <p className="text-amber-600 text-xs mt-1">
                                                                    💡 Create menu items in the
                                                                    Custom Menu step to link them
                                                                    with items here
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Default Fulfillment Type"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.default_fulfillment_type`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={[
                                                        { key: "Delivery", value: "Delivery" },
                                                        {
                                                            key: "Self-Pickup",
                                                            value: "Self-Pickup",
                                                        },
                                                    ]}
                                                    placeholder="Select Fulfillment Type"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Return Window"}
                                            required={true}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <Controller
                                                name={`items.${index}.return_window_unit`}
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectControl
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        options={[
                                                            { key: "Minutes", value: "minute" },
                                                            { key: "Hours", value: "hour" },
                                                            { key: "Days", value: "day" },
                                                        ]}
                                                        placeholder="Select Time Unit"
                                                    />
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
                                                        min={1}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            const unit =
                                                                watchItems[index]
                                                                    ?.return_window_unit || "hour";
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Replacement Window"}
                                            required={true}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <Controller
                                                name={`items.${index}.replacement_window_unit`}
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectControl
                                                        value={field.value}
                                                        options={[
                                                            { key: "Minutes", value: "minute" },
                                                            { key: "Hours", value: "hour" },
                                                            { key: "Days", value: "day" },
                                                        ]}
                                                        placeholder="Select Replacement Time Unit"
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const numValue =
                                                                watchItems[index]
                                                                    ?.replacement_window_value ||
                                                                "1";
                                                            updateIsoDuration(
                                                                index,
                                                                "replacement_window",
                                                                value,
                                                                numValue
                                                            );
                                                        }}
                                                    />
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
                                                        min={1}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            const unit =
                                                                watchItems[index]
                                                                    ?.replacement_window_unit ||
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Time to Ship"}
                                            required={true}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <Controller
                                                name={`items.${index}.time_to_ship_unit`}
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectControl
                                                        value={field.value}
                                                        options={[
                                                            { key: "Minutes", value: "minute" },
                                                            { key: "Hours", value: "hour" },
                                                            { key: "Days", value: "day" },
                                                        ]}
                                                        placeholder="Select Shipping Time Unit"
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const numValue =
                                                                watchItems[index]
                                                                    ?.time_to_ship_value || "45";
                                                            updateIsoDuration(
                                                                index,
                                                                "time_to_ship",
                                                                value,
                                                                numValue
                                                            );
                                                        }}
                                                    />
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
                                                        min={1}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            const unit =
                                                                watchItems[index]
                                                                    ?.time_to_ship_unit || "minute";
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Returnable"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.returnable`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value ? "yes" : "no"}
                                                    onValueChange={(value) =>
                                                        field.onChange(value === "yes")
                                                    }
                                                    options={YES_NO_OPTIONS}
                                                    placeholder="Select option"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Cancellable"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.cancellable`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value ? "yes" : "no"}
                                                    onValueChange={(value) =>
                                                        field.onChange(value === "yes")
                                                    }
                                                    options={YES_NO_OPTIONS}
                                                    placeholder="Select option"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"CoD Availability"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.cod_availability`}
                                            control={control}
                                            render={({ field }) => (
                                                <SelectControl
                                                    value={field.value ? "yes" : "no"}
                                                    onValueChange={(value) =>
                                                        field.onChange(value === "yes")
                                                    }
                                                    options={YES_NO_OPTIONS}
                                                    placeholder="Select option"
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const selectedCategory = watchItems[index]?.category || "";
                                const protocolKeys = getProtocolKeysByCategory(selectedCategory);

                                if (protocolKeys.length === 0) return null;

                                const hasPackaged = protocolKeys.includes(
                                    "@ondc/org/statutory_reqs_packaged_commodities"
                                );
                                const hasPrepackaged = protocolKeys.includes(
                                    "@ondc/org/statutory_reqs_prepackaged_food"
                                );

                                const referBackImage = watchItems[index]?.refer_back_image || false;

                                return (
                                    <div className="md:col-span-2">
                                        <h4 className="font-medium text-gray-700 mb-3">
                                            Statutory Requirements ({selectedCategory})
                                        </h4>

                                        <div className="mb-4">
                                            <LabelWithToolTip
                                                labelInfo={""}
                                                label={"Refer Back Image"}
                                                required={true}
                                            />

                                            <Controller
                                                name={`items.${index}.refer_back_image`}
                                                control={control}
                                                render={({ field }) => (
                                                    <SelectControl
                                                        value={field.value ? "yes" : "no"}
                                                        onValueChange={(value) =>
                                                            field.onChange(value === "yes")
                                                        }
                                                        options={YES_NO_OPTIONS}
                                                        placeholder="Select option"
                                                    />
                                                )}
                                            />
                                            {referBackImage && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    When referring to back image, statutory
                                                    requirements are not needed.
                                                </p>
                                            )}
                                        </div>

                                        {!referBackImage && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {hasPackaged && (
                                                    <>
                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Manufacturer or Packer Name"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.manufacturer_or_packer_name`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Manufacturer Or Packer Name"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Manufacturer or Packer Address"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.manufacturer_or_packer_address`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Enter Manufacturer Or Packer Address"
                                                                        rows={2}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Common or Generic Name of Commodity"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.common_or_generic_name_of_commodity`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Common Or Generic Name"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Net Quantity or Measure"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.net_quantity_or_measure_of_commodity_in_pkg`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="e.g., 500g, 1L"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Month and Year of Manufacture"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.month_year_of_manufacture_packing_import`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="e.g., 10/2024"
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
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Imported Product Country of Origin"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.imported_product_country_of_origin`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Country Of Origin"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Nutritional Info"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.nutritional_info`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Enter Nutritional Information"
                                                                        rows={3}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Additives Info"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.additives_info`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Enter Additives Information"
                                                                        rows={2}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Brand Owner Name"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.brand_owner_name`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Brand Owner Name"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Brand Owner Address"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.brand_owner_address`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Enter Brand Owner Address"
                                                                        rows={2}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={
                                                                    "Brand Owner FSSAI License No"
                                                                }
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.brand_owner_fssai_license_no`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter FSSAI License Number"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Other FSSAI License No"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.other_fssai_license_no`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter other FSSAI license number"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Importer Name"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.importer_name`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Importer Name"
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Importer Address"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.importer_address`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Enter Importer Address"
                                                                        rows={2}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div>
                                                            <LabelWithToolTip
                                                                labelInfo={""}
                                                                label={"Importer FSSAI License No"}
                                                                required={true}
                                                            />

                                                            <Controller
                                                                name={`items.${index}.importer_fssai_license_no`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter Importer FSSAI License Number"
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Country of Origin"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.country_of_origin`}
                                            control={control}
                                            render={({ field }) => (
                                                <ComboBoxControl
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={countries.map((country) => ({
                                                        label: country.key,
                                                        value: country.value,
                                                    }))}
                                                    placeholder="Select Country"
                                                />
                                            )}
                                        />
                                    </div>

                                    {(watchItems[index]?.domain === "Grocery" ||
                                        watchItems[index]?.domain === "F&B") && (
                                        <>
                                            <div>
                                                <LabelWithToolTip
                                                    labelInfo={""}
                                                    label={"Veg/NonVeg"}
                                                    required={true}
                                                />

                                                <Controller
                                                    name={`items.${index}.veg_non_veg`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <SelectControl
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                            options={[
                                                                { key: "Veg", value: "veg" },
                                                                {
                                                                    key: "Non-Veg",
                                                                    value: "non-veg",
                                                                },
                                                            ]}
                                                            placeholder="Select type"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {watchItems[index]?.domain === "Grocery" && (
                                                <div>
                                                    <SingleImageUpload
                                                        label="Back Image"
                                                        labelInfo="Upload back side image for this item (required for Grocery domain)"
                                                        required={true}
                                                        folder="workbench-seller-onboarding"
                                                        value={backImages.imageState[index] || ""}
                                                        onChange={(url) => {
                                                            backImages.updateImageField(index, url);
                                                            setValue(
                                                                `items.${index}.back_image`,
                                                                url
                                                            );
                                                        }}
                                                        previewSize="small"
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
                                        <label className="flex items-center gap-2 text-sm font-normal text-gray-700">
                                            <Checkbox
                                                checked={useExistingConsumerCare[index] || false}
                                                onCheckedChange={(checked) =>
                                                    handleConsumerCareToggle(
                                                        index,
                                                        checked === true
                                                    )
                                                }
                                            />
                                            Use same as first item
                                        </label>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Name"}
                                            required={true}
                                        />

                                        <Controller
                                            name={`items.${index}.consumer_care_name`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter consumer care name"
                                                    disabled={
                                                        useExistingConsumerCare[index] || false
                                                    }
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Email"}
                                            required={true}
                                        />

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
                                                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                                          message:
                                                              "Please enter a valid email address",
                                                      },
                                                validate: useExistingConsumerCare[index]
                                                    ? undefined
                                                    : {
                                                          validEmail: (
                                                              value: string | undefined
                                                          ) => {
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
                                                        aria-invalid={!!error}
                                                        disabled={
                                                            useExistingConsumerCare[index] || false
                                                        }
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
                                        <LabelWithToolTip
                                            labelInfo={""}
                                            label={"Contact No."}
                                            required={true}
                                        />

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
                                                          validPhone: (
                                                              value: string | undefined
                                                          ) => {
                                                              if (!value) return true;
                                                              // Remove spaces and hyphens for validation
                                                              const phone = value.replace(
                                                                  /[\s-]/g,
                                                                  ""
                                                              );
                                                              // Indian phone number validation
                                                              if (phone.startsWith("+91")) {
                                                                  if (phone.length !== 13)
                                                                      return "Indian number with +91 must be 13 digits total";
                                                                  const numberPart =
                                                                      phone.substring(3);
                                                                  if (
                                                                      !/^[6-9][0-9]{9}$/.test(
                                                                          numberPart
                                                                      )
                                                                  )
                                                                      return "Indian mobile numbers must start with 6-9";
                                                              } else if (phone.length === 10) {
                                                                  if (
                                                                      !/^[6-9][0-9]{9}$/.test(phone)
                                                                  )
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
                                                        maxLength={15}
                                                        aria-invalid={!!error}
                                                        disabled={
                                                            useExistingConsumerCare[index] || false
                                                        }
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
                                const selectedOptionals = selectedOptionalAttributes[index] || [];

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
                                                    <LabelWithToolTip
                                                        labelInfo={""}
                                                        label={"Brand"}
                                                        required={true}
                                                    />
                                                    <Controller
                                                        name={`items.${index}.brand`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                placeholder="Enter brand name"
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
                                                                config as AttributeConfig,
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
                                                    <ComboBoxMultiControl
                                                        value={selectedOptionals}
                                                        onValueChange={(values) =>
                                                            handleOptionalAttributeChange(
                                                                index,
                                                                values
                                                            )
                                                        }
                                                        options={Object.keys(
                                                            optionalAttributes
                                                        ).map((attributeName) => ({
                                                            label: attributeName
                                                                .replace(/_/g, " ")
                                                                .replace(/\b\w/g, (l) =>
                                                                    l.toUpperCase()
                                                                ),
                                                            value: attributeName,
                                                        }))}
                                                        placeholder="Choose optional attributes to add"
                                                    />
                                                </div>

                                                {/* Render Selected Optional Attributes */}
                                                {selectedOptionals.length > 0 && (
                                                    <>
                                                        <h5 className="text-sm font-medium text-gray-600 mb-2">
                                                            Selected Optional Attributes
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {selectedOptionals.map(
                                                                (attributeName) => {
                                                                    const config =
                                                                        optionalAttributes[
                                                                            attributeName
                                                                        ];
                                                                    return renderAttributeField(
                                                                        attributeName,
                                                                        config as AttributeConfig,
                                                                        index,
                                                                        true
                                                                    );
                                                                }
                                                            )}
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
                                        variant="outline"
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
                                                    className="p-3 border border-gray-200 rounded-lg bg-white shadow-xs hover:shadow-md transition-shadow"
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
                                                                            {key.replace(/_/g, " ")}
                                                                            :
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
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    openEditVariantModal(
                                                                        index,
                                                                        vIdx
                                                                    )
                                                                }
                                                                className="h-auto text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                                                                title="View/Edit variant"
                                                            >
                                                                <FaEdit className="text-sm" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setPendingRemoveVariant({
                                                                        itemIndex: index,
                                                                        variantIndex: vIdx,
                                                                    })
                                                                }
                                                                className="h-auto text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                                title="Remove variant"
                                                            >
                                                                <FaTrash className="text-sm" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border-l-4 border-blue-200">
                                            <strong>Note:</strong> Each variant above will be
                                            created as an individual item in your product catalog.
                                            Customers can discover and purchase each variant
                                            independently based on their specific attribute
                                            preferences.
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
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={addItem}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 gap-2"
                    >
                        <FaPlus />
                        Add Another Item
                    </Button>
                </div>

                <div className="flex justify-between pt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onPrevious}
                        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
                    >
                        Previous
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner className="size-4" />
                                Loading...
                            </>
                        ) : (
                            "Next"
                        )}
                    </Button>
                </div>
            </form>

            {/* Variant Creation Modals */}
            {fields.map((_field, index) => (
                <Dialog
                    key={`variant-modal-${index}`}
                    modal={false}
                    open={showVariantModal[index] || false}
                    onOpenChange={(open) => {
                        if (!open) {
                            requestCloseCreateVariantModal(index);
                        }
                    }}
                >
                    <DialogContent className="max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {`${
                                    itemVariants[index] && itemVariants[index].length > 0
                                        ? "Add More Variants for"
                                        : "Create Variants for"
                                } ${watchItems[index]?.name || `Item ${index + 1}`}`}
                            </DialogTitle>
                        </DialogHeader>
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
                                <LabelWithToolTip
                                    labelInfo={""}
                                    label={"Select Variant Attributes"}
                                    required={true}
                                />

                                <ComboBoxMultiControl
                                    value={selectedVariantAttributes[index] || []}
                                    onValueChange={(values) => {
                                        setSelectedVariantAttributes((prev) => ({
                                            ...prev,
                                            [index]: values,
                                        }));
                                    }}
                                    options={getAvailableAttributesForVariants(index).map(
                                        (attr) => ({
                                            label: attr
                                                .replace(/_/g, " ")
                                                .replace(/\b\w/g, (l) => l.toUpperCase()),
                                            value: attr,
                                        })
                                    )}
                                    placeholder="Choose attributes that will differ in variants"
                                />
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
                                                                .replace(/\b\w/g, (l) =>
                                                                    l.toUpperCase()
                                                                )}{" "}
                                                            Values
                                                            {hasPredefinedValues && (
                                                                <span className="text-xs text-blue-600 ml-2">
                                                                    (Select from predefined values
                                                                    or add custom)
                                                                </span>
                                                            )}
                                                        </label>
                                                        <TagsInput
                                                            value={
                                                                variantValues[index]?.[attr] || []
                                                            }
                                                            onChange={(values) => {
                                                                setVariantValues((prev) => ({
                                                                    ...prev,
                                                                    [index]: {
                                                                        ...prev[index],
                                                                        [attr]: values,
                                                                    },
                                                                }));
                                                            }}
                                                            suggestions={
                                                                hasPredefinedValues
                                                                    ? predefinedValues
                                                                    : []
                                                            }
                                                            placeholder={
                                                                hasPredefinedValues
                                                                    ? `Select from list or type custom ${attr} values`
                                                                    : `Enter ${attr} values (press Enter after each)`
                                                            }
                                                        />
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
                                                            const counts =
                                                                selectedVariantAttributes[
                                                                    index
                                                                ].map(
                                                                    (attr) =>
                                                                        variantValues[index]?.[attr]
                                                                            ?.length || 0
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
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => requestCloseCreateVariantModal(index)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={() => handleCreateVariants(index)}>
                                {itemVariants[index] && itemVariants[index].length > 0
                                    ? "Add More Variants"
                                    : "Create Variants"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ))}

            {/* Edit Variant Modal */}
            <Dialog
                open={editVariantModal.visible}
                onOpenChange={(open) => !open && requestCloseEditVariant()}
            >
                <DialogContent className="max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>View/Edit Variant Details</DialogTitle>
                    </DialogHeader>
                    {editingVariant && (
                        <div className="max-h-[600px] overflow-y-auto">
                            {/* Basic Information Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Item Name<span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Input
                                            value={variantFormValues.name ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("name", e.target.value)
                                            }
                                            placeholder="Enter item name"
                                            aria-invalid={!!variantFormErrors.name}
                                        />
                                        {variantFormErrors.name && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {variantFormErrors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Hide Code Type and Code Value for F&B domain */}
                                    {editVariantModal.itemIndex !== null &&
                                        watchItems[editVariantModal.itemIndex]?.domain !==
                                            "F&B" && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Code Type
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <SelectControl
                                                        value={variantFormValues.code_type}
                                                        onValueChange={(value) =>
                                                            updateVariantField("code_type", value)
                                                        }
                                                        options={[
                                                            { key: "EAN", value: "EAN" },
                                                            { key: "ISBN", value: "ISBN" },
                                                            { key: "GTIN", value: "GTIN" },
                                                            { key: "HSN", value: "HSN" },
                                                            { key: "Others", value: "Others" },
                                                        ]}
                                                        placeholder="Select code type"
                                                        className={
                                                            variantFormErrors.code_type
                                                                ? "border-destructive"
                                                                : undefined
                                                        }
                                                    />
                                                    {variantFormErrors.code_type && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {variantFormErrors.code_type}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Code Value
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <Input
                                                        value={variantFormValues.code_value ?? ""}
                                                        onChange={(e) =>
                                                            updateVariantField(
                                                                "code_value",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter code value"
                                                        aria-invalid={
                                                            !!variantFormErrors.code_value
                                                        }
                                                    />
                                                    {variantFormErrors.code_value && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {variantFormErrors.code_value}
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                    <div className="md:col-span-2">
                                        <MultiImageUpload
                                            label="Variant Images"
                                            labelInfo="Upload multiple images for this variant"
                                            required={true}
                                            folder="workbench-seller-onboarding"
                                            value={
                                                editVariantModal.itemIndex !== null &&
                                                editVariantModal.variantIndex !== null
                                                    ? variantImages.imageState[
                                                          `${editVariantModal.itemIndex}-${editVariantModal.variantIndex}`
                                                      ] || []
                                                    : []
                                            }
                                            onChange={(urls) => {
                                                if (
                                                    editVariantModal.itemIndex !== null &&
                                                    editVariantModal.variantIndex !== null
                                                ) {
                                                    const variantKey = `${editVariantModal.itemIndex}-${editVariantModal.variantIndex}`;
                                                    variantImages.updateImageField(
                                                        variantKey,
                                                        urls
                                                    );
                                                }
                                            }}
                                            maxFiles={5}
                                            previewSize="small"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Symbol/Icon
                                        </label>
                                        <SingleImageUpload
                                            label=""
                                            labelInfo="Upload a symbol/icon for this variant"
                                            required={false}
                                            folder="workbench-seller-onboarding"
                                            value={
                                                editVariantModal.itemIndex !== null &&
                                                editVariantModal.variantIndex !== null
                                                    ? variantSymbolImages.imageState[
                                                          `${editVariantModal.itemIndex}-${editVariantModal.variantIndex}`
                                                      ] || ""
                                                    : ""
                                            }
                                            onChange={(url) => {
                                                if (
                                                    editVariantModal.itemIndex !== null &&
                                                    editVariantModal.variantIndex !== null
                                                ) {
                                                    const variantKey = `${editVariantModal.itemIndex}-${editVariantModal.variantIndex}`;
                                                    variantSymbolImages.updateImageField(
                                                        variantKey,
                                                        url
                                                    );
                                                }
                                            }}
                                            previewSize="small"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                                    Descriptions
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Short Description
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Textarea
                                            value={variantFormValues.short_desc ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("short_desc", e.target.value)
                                            }
                                            rows={2}
                                            placeholder="Enter short description"
                                            aria-invalid={!!variantFormErrors.short_desc}
                                        />
                                        {variantFormErrors.short_desc && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {variantFormErrors.short_desc}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Long Description
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Textarea
                                            value={variantFormValues.long_desc ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("long_desc", e.target.value)
                                            }
                                            rows={3}
                                            placeholder="Enter long description"
                                            aria-invalid={!!variantFormErrors.long_desc}
                                        />
                                        {variantFormErrors.long_desc && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {variantFormErrors.long_desc}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                                    Pricing
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Selling Price (₹)
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Input
                                            value={variantFormValues.selling_price ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("selling_price", e.target.value)
                                            }
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter selling price"
                                            aria-invalid={!!variantFormErrors.selling_price}
                                        />
                                        {variantFormErrors.selling_price && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {variantFormErrors.selling_price}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MRP (₹)<span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Input
                                            value={variantFormValues.mrp ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("mrp", e.target.value)
                                            }
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter MRP"
                                            aria-invalid={!!variantFormErrors.mrp}
                                        />
                                        {variantFormErrors.mrp && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {variantFormErrors.mrp}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                                    Quantity & Units
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Unit
                                        </label>
                                        <SelectControl
                                            value={variantFormValues.unit}
                                            onValueChange={(value) =>
                                                updateVariantField("unit", value)
                                            }
                                            options={[
                                                { key: "Unit", value: "unit" },
                                                { key: "Kilogram", value: "kg" },
                                                { key: "Gram", value: "g" },
                                                { key: "Liter", value: "l" },
                                                { key: "Milliliter", value: "ml" },
                                                { key: "Dozen", value: "dozen" },
                                                { key: "Pack", value: "pack" },
                                            ]}
                                            placeholder="Select unit"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Value
                                        </label>
                                        <Input
                                            value={variantFormValues.value ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("value", e.target.value)
                                            }
                                            placeholder="Enter value (e.g., 1, 500)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Available Count
                                        </label>
                                        <Input
                                            value={variantFormValues.available_count ?? ""}
                                            onChange={(e) =>
                                                updateVariantField(
                                                    "available_count",
                                                    e.target.value
                                                )
                                            }
                                            type="number"
                                            placeholder="Enter available quantity"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Maximum Count
                                        </label>
                                        <Input
                                            value={variantFormValues.maximum_count ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("maximum_count", e.target.value)
                                            }
                                            type="number"
                                            placeholder="Enter maximum order quantity"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Minimum Count
                                        </label>
                                        <Input
                                            value={variantFormValues.minimum_count ?? ""}
                                            onChange={(e) =>
                                                updateVariantField("minimum_count", e.target.value)
                                            }
                                            type="number"
                                            placeholder="Enter minimum order quantity"
                                        />
                                    </div>
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
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {key
                                                            .replace(/_/g, " ")
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            key.replace(/_/g, " ").slice(1)}
                                                    </label>
                                                    <Input
                                                        value={variantFormValues[key] ?? ""}
                                                        onChange={(e) =>
                                                            updateVariantField(key, e.target.value)
                                                        }
                                                        placeholder={`Enter ${key}`}
                                                    />
                                                </div>
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
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {key
                                                            .replace(/_/g, " ")
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            key.replace(/_/g, " ").slice(1)}
                                                    </label>
                                                    <Input
                                                        value={variantFormValues[key] ?? ""}
                                                        onChange={(e) =>
                                                            updateVariantField(key, e.target.value)
                                                        }
                                                        placeholder={`Enter ${key}`}
                                                    />
                                                </div>
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
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={requestCloseEditVariant}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveVariant}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isEditVariantConfirmOpen}
                onOpenChange={(open) => !open && setIsEditVariantConfirmOpen(false)}
                title="Discard variant edits?"
                description="You have unsaved changes to this variant. Closing now will discard them. This action cannot be undone."
                confirmText="Discard"
                cancelText="Keep editing"
                danger
                onConfirm={() => {
                    setIsEditVariantConfirmOpen(false);
                    handleCancelEditVariant();
                }}
            />

            <ConfirmDialog
                open={pendingCloseCreateVariantIndex !== null}
                onOpenChange={(open) => !open && setPendingCloseCreateVariantIndex(null)}
                title="Discard variant selections?"
                description="You have unsaved attribute selections for this item. Closing now will discard them. This action cannot be undone."
                confirmText="Discard"
                cancelText="Keep editing"
                danger
                onConfirm={() => {
                    if (pendingCloseCreateVariantIndex !== null) {
                        closeCreateVariantModal(pendingCloseCreateVariantIndex);
                    }
                    setPendingCloseCreateVariantIndex(null);
                }}
            />

            <ConfirmDialog
                open={!!pendingRemoveVariant}
                onOpenChange={(open) => !open && setPendingRemoveVariant(null)}
                title="Remove variant"
                description="Are you sure you want to remove this variant? This action cannot be undone."
                confirmText="Remove"
                cancelText="Cancel"
                danger
                onConfirm={() => {
                    if (pendingRemoveVariant) {
                        removeVariant(
                            pendingRemoveVariant.itemIndex,
                            pendingRemoveVariant.variantIndex
                        );
                    }
                    setPendingRemoveVariant(null);
                }}
            />
        </div>
    );
};

export default ItemDetailsForm;
