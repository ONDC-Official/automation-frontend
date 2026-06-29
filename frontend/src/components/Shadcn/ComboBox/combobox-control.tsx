import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import {
    ComboBoxOptionInput,
    normalizeComboBoxOptions,
} from "@/components/Shadcn/ComboBox/combo-box-options";
import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { cn } from "@/lib/utils";

export interface IComboBoxControlProps {
    value?: string;
    onValueChange?: (value: string) => void;
    options: ComboBoxOptionInput[];
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    className?: string;
}

export const ComboBoxControl = ({
    value,
    onValueChange,
    options,
    label,
    placeholder,
    required = false,
    disabled = false,
    error,
    className,
}: IComboBoxControlProps) => {
    const normalizedOptions = normalizeComboBoxOptions(options);
    const items = normalizedOptions.map((option) => option.value);

    const getLabel = (itemValue: string) =>
        normalizedOptions.find((option) => option.value === itemValue)?.label ?? itemValue;

    return (
        <Field data-invalid={!!error} className={cn("w-full", className)}>
            {label && (
                <FieldLabel className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
            )}
            <Combobox
                items={items}
                value={value || null}
                onValueChange={(next) => onValueChange?.(next ?? "")}
                disabled={disabled}
            >
                <ComboboxInput
                    className="w-full"
                    placeholder={placeholder ?? "Select a value"}
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

export default ComboBoxControl;
