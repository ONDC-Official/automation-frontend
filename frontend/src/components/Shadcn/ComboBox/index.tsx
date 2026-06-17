import { Controller, FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import {
    Combobox as ShadCnComboBox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
} from "@/components/Shadcn/ComboBox/combobox";
import { IComboBoxProps } from "@/components/Shadcn/ComboBox/types";

export const ComboBox = <T extends FieldValues>({
    control,
    name,
    label,
    options,
    placeholder,
    required = false,
    disabled = false,
    onValueChange,
}: IComboBoxProps<T>) => (
    <Controller
        control={control}
        name={name}
        rules={{ required: required ? "Field required" : false }}
        render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
                <FieldLabel className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
                <ShadCnComboBox
                    items={options}
                    value={field.value || null}
                    onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                            onValueChange?.(value);
                        }
                    }}
                    disabled={disabled}
                >
                    <ComboboxInput
                        className="w-full"
                        placeholder={placeholder ?? "Select a value"}
                        disabled={disabled}
                        aria-invalid={!!fieldState.error}
                    />
                    <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                            {(item) => (
                                <ComboboxItem key={item} value={item}>
                                    {item}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </ShadCnComboBox>
                {fieldState.error?.message && <FieldError>{fieldState.error.message}</FieldError>}
            </Field>
        )}
    />
);

export default ComboBox;
