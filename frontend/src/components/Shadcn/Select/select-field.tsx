import type { ReactNode } from "react";
import type {
    Control,
    FieldErrors,
    FieldValues,
    RegisterOptions,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface ISelectOption {
    key: string;
    value: string;
}

export interface ISelectFieldProps<T extends FieldValues = FieldValues> {
    name: string;
    label: string;
    options: (string | ISelectOption)[];
    register?: UseFormRegister<T>;
    control?: Control<T>;
    errors?: FieldErrors<T>;
    rules?: RegisterOptions<T>;
    setSelectedValue?: (value: string) => void;
    defaultValue?: string;
    labelInfo?: string;
    nonSelectedValue?: boolean;
    disabled?: boolean;
    required?: boolean | string;
    currentValue?: string;
    setValue?: UseFormSetValue<T>;
    className?: string;
}

const normalizeOptions = (options: (string | ISelectOption)[]): ISelectOption[] =>
    options.map((option) => (typeof option === "string" ? { key: option, value: option } : option));

export const SelectField = <T extends FieldValues = FieldValues>({
    name,
    label,
    options,
    register,
    control,
    errors,
    rules,
    setSelectedValue = () => {},
    defaultValue,
    nonSelectedValue = false,
    disabled = false,
    required = false,
    currentValue,
    setValue,
    className,
}: ISelectFieldProps<T>) => {
    const normalizedOptions = normalizeOptions(options);
    const isControlled = currentValue !== undefined;

    const validationRules = {
        required: required ? (typeof required === "string" ? required : "Field required") : false,
        ...rules,
    };

    const fieldError = name && errors?.[name]?.message ? String(errors[name]?.message) : undefined;

    const renderSelect = (value: string, onValueChange: (nextValue: string) => void) => (
        <Select
            value={value || undefined}
            onValueChange={(nextValue) => {
                onValueChange(nextValue);
                if (isControlled && setValue) {
                    setValue(name as never, nextValue as never);
                }
                setSelectedValue(nextValue);
            }}
            disabled={disabled}
        >
            <SelectTrigger aria-invalid={!!fieldError} className="w-full">
                <SelectValue placeholder={nonSelectedValue ? "Select a value" : undefined} />
            </SelectTrigger>
            <SelectContent>
                {normalizedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.key}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const fieldLayout = (selectNode: ReactNode) => (
        <Field data-invalid={!!fieldError} className={cn("w-full", className)}>
            <FieldLabel htmlFor={name} className="font-semibold">
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {selectNode}
            {fieldError && <FieldError>{fieldError}</FieldError>}
        </Field>
    );

    if (control) {
        return (
            <Controller
                name={name as never}
                control={control}
                rules={validationRules}
                defaultValue={(isControlled ? currentValue : defaultValue) as never}
                render={({ field }) => {
                    const selectValue = isControlled ? (currentValue ?? "") : (field.value ?? "");
                    return fieldLayout(
                        renderSelect(selectValue, (nextValue) => {
                            field.onChange(nextValue);
                        })
                    );
                }}
            />
        );
    }

    const registration = register ? register(name as never, validationRules) : undefined;

    return (
        <>
            {registration && <input type="hidden" {...registration} />}
            {fieldLayout(
                renderSelect(
                    isControlled ? (currentValue ?? "") : (defaultValue ?? ""),
                    (nextValue) => {
                        registration?.onChange({ target: { name, value: nextValue } });
                    }
                )
            )}
        </>
    );
};

export default SelectField;
