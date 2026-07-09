import { useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { Badge } from "@components/Shadcn/Badge/badge";
import { Button } from "@components/Shadcn/Button";
import {
    ComboBoxOptionInput,
    normalizeComboBoxOptions,
} from "@components/Shadcn/ComboBox/combo-box-options";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@components/Shadcn/ComboBox/combobox";
import { Field, FieldError, FieldLabel } from "@components/Shadcn/TextField/field";
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
    const items = useMemo(
        () => normalizedOptions.map((option) => option.value),
        [normalizedOptions]
    );

    const getLabel = (itemValue: string) =>
        normalizedOptions.find((option) => option.value === itemValue)?.label ?? itemValue;

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
                                <Button
                                    type="button"
                                    onClick={() => removeValue(item)}
                                    className="rounded-full p-0.5 hover:bg-n-30"
                                    aria-label={`Remove ${getLabel(item)}`}
                                >
                                    <XMarkIcon className="size-3" />
                                </Button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}
            <Combobox
                multiple
                items={items}
                value={value}
                onValueChange={(next) => onValueChange?.(Array.isArray(next) ? next : [])}
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
