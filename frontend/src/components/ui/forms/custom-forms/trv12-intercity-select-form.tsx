import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ComboBox } from "@/components/Shadcn/ComboBox";
import { Button } from "@/components/Shadcn/Button/button";
import TextField from "@/components/Shadcn/TextField";
import PayloadEditor from "@/components/ui/mini-components/payload-editor";
import FormDialogShell from "@/components/ui/forms/form-dialog-shell";
import { PastePayloadButton } from "@/components/ui/forms/paste-payload-button";
import {
    ICatalogItem,
    IOnSearchPayload,
    IFormData,
    ITRV12IntercitySelectProps,
    DEFAULT_FORM_DATA,
} from "../types/trv12-intercity-select-form-types";

export default function TRV12IntercitySelectForm({ submitEvent }: ITRV12IntercitySelectProps) {
    const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);
    const [errorWhilePaste, setErrorWhilePaste] = useState("");
    const [catalogItems, setCatalogItems] = useState<ICatalogItem[]>([]);

    const { control, handleSubmit, setValue } = useForm<IFormData>({
        defaultValues: DEFAULT_FORM_DATA,
    });

    const handlePaste = (payload: unknown) => {
        try {
            const parsedPayload = payload as IOnSearchPayload;
            if (!parsedPayload?.message?.catalog?.providers?.length) {
                throw new Error("Invalid Schema");
            }

            const provider = parsedPayload.message.catalog.providers[0];

            setValue("provider", provider.id);
            setValue("fulfillment", provider.fulfillments?.[0]?.id || "");
            setCatalogItems(provider.items || []);
            setErrorWhilePaste("");
        } catch (err) {
            setErrorWhilePaste("Invalid payload structure.");
            toast.error("Invalid payload structure");
            console.error(err);
        }

        setIsPayloadEditorActive(false);
    };

    const onSubmit = async (data: IFormData) => {
        const finalPayload = {
            provider: data.provider,
            fulfillment: data.fulfillment,
            items: [
                {
                    itemId: data.itemId,
                    count:
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(String(data.count), 10) || 1,
                    addOns: [],
                },
            ],
        };

        await submitEvent({
            jsonPath: {},
            formData: {
                data: JSON.stringify(finalPayload),
            },
        });
    };

    return (
        <>
            {isPayloadEditorActive && (
                <PayloadEditor
                    onAdd={handlePaste}
                    onClose={() => setIsPayloadEditorActive(false)}
                />
            )}

            <FormDialogShell
                onSubmit={handleSubmit(onSubmit)}
                footer={<Button type="submit">Submit</Button>}
            >
                {errorWhilePaste && <p className="text-sm text-destructive">{errorWhilePaste}</p>}

                <div className="flex items-center gap-2">
                    <PastePayloadButton
                        label="Paste on_search"
                        onClick={() => setIsPayloadEditorActive(true)}
                        className="mb-0"
                    />
                    <p className="text-sm font-semibold text-destructive">
                        Please paste the third on_search payload here first to populate the item id
                        to select from dropdown
                    </p>
                </div>

                <div className="space-y-2 rounded-lg border border-border p-4">
                    <ComboBox
                        control={control}
                        name="itemId"
                        label="Select Item Id"
                        required
                        options={catalogItems.map((item) => item.id)}
                    />

                    <TextField
                        control={control}
                        name="count"
                        label="Select Item Quantity"
                        type="number"
                        min={1}
                        required
                    />
                </div>
            </FormDialogShell>
        </>
    );
}
