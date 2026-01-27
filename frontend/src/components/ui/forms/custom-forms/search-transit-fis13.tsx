import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaRegPaste } from "react-icons/fa6";
import { toast } from "react-toastify";
import PayloadEditor from "../../mini-components/payload-editor";
import { SubmitEventParams } from "../../../../types/flow-types";

interface DynamicInput {
    descriptor: {
        code: string;
        short_desc?: string;
    };
    value: string;
}

export default function SearchTransitFis13({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [cityCode, setCityCode] = useState("*");
    const [allProviders, setAllProviders] = useState<any[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("");
    const [selectedItemId, setSelectedItemId] = useState<string>("");
    const [dynamicInputs, setDynamicInputs] = useState<DynamicInput[]>([]);

    const { register, handleSubmit } = useForm();

    const selectedProvider = allProviders.find(p => p.id === selectedProviderId);
    const availableItems = selectedProvider?.items || [];

    const handlePaste = (payload: any) => {
        try {
            const context = payload?.context;
            const message = payload?.message;
            const providers = message?.catalog?.providers;

            if (!providers || !providers.length) {
                throw new Error("Invalid payload: No providers found");
            }

            const extractedCityCode = context?.location?.city?.code || "*";
            setCityCode(extractedCityCode);
            setAllProviders(providers);

            // Auto-select first provider and first item
            const firstProvider = providers[0];
            const firstItem = firstProvider.items?.[0];

            setSelectedProviderId(firstProvider.id);
            setSelectedItemId(firstItem?.id || "");

            setIsPayloadEditorActive(false);
            toast.success("Payload parsed successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to parse payload");
        }
    };

    // Update BAP_INPUTS when item selection changes
    useEffect(() => {
        if (!selectedProvider || !selectedItemId) {
            setDynamicInputs([]);
            return;
        }

        const selectedItem = selectedProvider.items?.find((item: any) => item.id === selectedItemId);
        if (!selectedItem) {
            setDynamicInputs([]);
            return;
        }

        const bapInputsTag = selectedItem.tags?.find(
            (t: any) => t.descriptor?.code === "BAP_INPUTS"
        );

        if (bapInputsTag && bapInputsTag.list) {
            setDynamicInputs(bapInputsTag.list);
        } else {
            setDynamicInputs([]);
        }
    }, [selectedProviderId, selectedItemId, selectedProvider]);

    // Helper function to determine input type based on descriptor code
    const getInputType = (code: string): string => {
        const upperCode = code.toUpperCase();

        // Date fields
        if (upperCode.includes('DATE') || upperCode.includes('DOB') || upperCode.includes('BIRTH')) {
            return 'date';
        }

        // Email fields
        if (upperCode.includes('EMAIL')) {
            return 'email';
        }

        // Phone fields
        if (upperCode.includes('PHONE') || upperCode.includes('MOBILE') || upperCode.includes('TEL')) {
            return 'tel';
        }

        // Alphanumeric fields (should be text, not number)
        if (upperCode.includes('PAN') || upperCode.includes('AADHAR') ||
            upperCode.includes('AADHAAR') || upperCode.includes('GSTIN') ||
            upperCode.includes('LICENSE') || upperCode.includes('PASSPORT')) {
            return 'text';
        }


        if (upperCode.includes('AGE') || upperCode.includes('AMOUNT') ||
            upperCode.includes('PINCODE') || upperCode.includes('PIN_CODE')) {
            return 'number';
        }


        return 'text';
    };


    const formatLabel = (code: string): string => {
        return code
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    };


    const renderInputField = (input: DynamicInput) => {
        const inputType = getInputType(input.descriptor.code);
        const label = formatLabel(input.descriptor.code);



        return (
            <div key={input.descriptor.code} className="space-y-1">
                <label className={labelStyle}>
                    {label}
                </label>
                <input
                    type={inputType}
                    {...register(input.descriptor.code)}

                    className={inputStyle}
                />
            </div>
        );
    };

    const onSubmit = async (formData: any) => {
        if (!selectedProvider) {
            toast.error("Please select a provider");
            return;
        }

        const provider = JSON.parse(JSON.stringify(selectedProvider));

        // Update BAP_INPUTS for the selected item
        const selectedItem = provider.items?.find((item: any) => item.id === selectedItemId);
        if (selectedItem) {
            const bapInputsTag = selectedItem.tags?.find(
                (t: any) => t.descriptor?.code === "BAP_INPUTS"
            );
            if (bapInputsTag && bapInputsTag.list) {
                bapInputsTag.list.forEach((input: any) => {
                    if (formData[input.descriptor.code] !== undefined) {
                        input.value = formData[input.descriptor.code];
                    }
                });
            }
        }

        const finalOutput = {
            provider: {
                id: provider.id,
                tags: provider.tags,
                items: provider.items.filter((item: any) => item.id === selectedItemId),
            },
            city_code: cityCode,
        };

        await submitEvent({
            jsonPath: {},
            formData: finalOutput as any,
        });
    };

    const inputStyle = "border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 transition-all";
    const labelStyle = "mb-1.5 font-medium block text-gray-700 text-sm";
    const sectionTitleStyle = "text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100";

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transit Insurance Search</h2>
                    <p className="text-gray-500 text-sm mt-1">Configure your search parameters for transit insurance</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsPayloadEditorActive(true)}
                    className="flex items-center gap-2 py-2.5 px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium border border-blue-100"
                >
                    <FaRegPaste size={18} />
                    <span>Paste on_search</span>
                </button>
            </div>

            {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}

            {allProviders.length > 0 ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-2">Provider ID</label>
                                <select
                                    value={selectedProviderId}
                                    onChange={(e) => {
                                        setSelectedProviderId(e.target.value);
                                        const newProvider = allProviders.find(p => p.id === e.target.value);
                                        setSelectedItemId(newProvider?.items?.[0]?.id || "");
                                    }}
                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {allProviders.map((provider) => (
                                        <option key={provider.id} value={provider.id}>
                                            {provider.descriptor?.name || provider.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-2">Item ID</label>
                                <select
                                    value={selectedItemId}
                                    onChange={(e) => setSelectedItemId(e.target.value)}
                                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-gray-900 font-medium text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    {availableItems.map((item: any) => (
                                        <option key={item.id} value={item.id}>
                                            {item.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {dynamicInputs.length > 0 ? (
                        <div>
                            <h3 className={sectionTitleStyle}>Dynamic Inputs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {dynamicInputs.map((input) => renderInputField(input))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-amber-700 font-medium">No BAP_INPUTS found for selected item</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
                        >
                            Search Transit Insurance
                        </button>
                    </div>
                </form >
            ) : (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4 text-blue-500">
                        <FaRegPaste size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">No Data Available</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Please paste the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-medium">on_search</code> payload to initialize the form fields.
                    </p>
                </div>
            )
            }
        </div >
    );
}
