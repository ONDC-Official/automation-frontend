import { useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/Shadcn/Badge/badge";
import {
    ComboBoxOptionInput,
    normalizeComboBoxOptions,
} from "@/components/Shadcn/ComboBox/combo-box-options";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { cn } from "@/lib/utils";

export interface IComboBoxMultiControlProps {
    value?: string[];
    onValueChange?: (value: string[]) => void;
    options: ComboBoxOptionInput[];
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
}

export const ComboBoxMultiControl = ({
    value = [],
    onValueChange,
    options,
    label,
    placeholder,
    required = false,
    disabled = false,
    error,
    className,
}: IComboBoxMultiControlProps) => {
    const normalizedOptions = useMemo(() => normalizeComboBoxOptions(options), [options]);

    const getLabel = (itemValue: string) =>
        normalizedOptions.find((option) => option.value === itemValue)?.label ?? itemValue;

    const availableItems = normalizedOptions
        .map((option) => option.value)
        .filter((optionValue) => !value.includes(optionValue));

    const addValue = (next: string | null) => {
        if (!next || value.includes(next)) return;
        onValueChange?.([...value, next]);
    };

    const removeValue = (target: string) => {
        onValueChange?.(value.filter((item) => item !== target));
    };

    return (
        <Field data-invalid={!!error} className={cn("w-full", className)}>
            {label && (
                <FieldLabel className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
            )}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((item) => (
                        <Badge key={item} variant="secondary" className="gap-1 py-1 pr-1">
                            {getLabel(item)}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => removeValue(item)}
                                    className="rounded-full p-0.5 hover:bg-n-30"
                                    aria-label={`Remove ${getLabel(item)}`}
                                >
                                    <XMarkIcon className="size-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}
            <Combobox
                items={availableItems}
                value={null}
                onValueChange={addValue}
                disabled={disabled}
            >
                <ComboboxInput
                    className="w-full"
                    placeholder={placeholder ?? "Select values"}
                    disabled={disabled}
                    aria-invalid={!!error}
                />
                <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item) => (
                            <ComboboxItem key={item} value={item}>
                                {getLabel(item)}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
            {error && <FieldError>{error}</FieldError>}
        </Field>
    );
};

export default ComboBoxMultiControl;
