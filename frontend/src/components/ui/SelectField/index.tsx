import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/shadcn/field";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn/select";

export type SelectFieldProps<T extends FieldValues> = {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    options: string[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
};

export function SelectField<T extends FieldValues>({
    control,
    name,
    label,
    options,
    placeholder,
    required = false,
    disabled = false,
    onValueChange,
}: SelectFieldProps<T>) {
    return (
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
                    <Select
                        value={field.value || undefined}
                        onValueChange={(value) => {
                            field.onChange(value);
                            onValueChange?.(value);
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                            <SelectValue placeholder={placeholder ?? "Select a value"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {fieldState.error?.message && (
                        <FieldError>{fieldState.error.message}</FieldError>
                    )}
                </Field>
            )}
        />
    );
}
