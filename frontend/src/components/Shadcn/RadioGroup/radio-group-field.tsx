import type { ReactNode } from "react";
import type {
    Control,
    FieldErrors,
    FieldValues,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/Shadcn/TextField/field";
import { cn } from "@/lib/utils";

import { RadioGroup, RadioGroupItem } from "./radio-group";

export interface IRadioGroupOption {
    label: string;
    value: string;
}

export interface IRadioGroupFieldProps<T extends FieldValues = FieldValues> {
    name: string;
    label: string;
    options: IRadioGroupOption[];
    register?: UseFormRegister<T>;
    control?: Control<T>;
    errors?: FieldErrors<T>;
    rules?: RegisterOptions<T>;
    defaultValue?: string;
    disabled?: boolean;
    required?: boolean | string;
    className?: string;
}

export const RadioGroupField = <T extends FieldValues = FieldValues>({
    name,
    label,
    options,
    register,
    control,
    errors,
    rules,
    defaultValue,
    disabled = false,
    required = false,
    className,
}: IRadioGroupFieldProps<T>) => {
    const validationRules = {
        required: required ? (typeof required === "string" ? required : "Field required") : false,
        ...rules,
    };

    const fieldError = name && errors?.[name]?.message ? String(errors[name]?.message) : undefined;

    const renderRadioGroup = (value: string, onValueChange: (nextValue: string) => void) => (
        <RadioGroup
            value={value || undefined}
            onValueChange={onValueChange}
            disabled={disabled}
            aria-invalid={!!fieldError}
        >
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        "flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground",
                        disabled && "cursor-not-allowed opacity-50"
                    )}
                >
                    <RadioGroupItem value={option.value} />
                    {option.label}
                </label>
            ))}
        </RadioGroup>
    );

    const fieldLayout = (radioGroupNode: ReactNode) => (
        <Field data-invalid={!!fieldError} className={className}>
            <FieldLabel className="font-semibold">
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {radioGroupNode}
            {fieldError && <FieldError>{fieldError}</FieldError>}
        </Field>
    );

    if (control) {
        return (
            <Controller
                name={name as never}
                control={control}
                rules={validationRules}
                defaultValue={defaultValue as never}
                render={({ field }) =>
                    fieldLayout(renderRadioGroup(field.value ?? "", field.onChange))
                }
            />
        );
    }

    const registration = register ? register(name as never, validationRules) : undefined;

    return (
        <>
            {registration && <input type="hidden" {...registration} />}
            {fieldLayout(
                renderRadioGroup(defaultValue ?? "", (nextValue) => {
                    registration?.onChange({ target: { name, value: nextValue } });
                })
            )}
        </>
    );
};

export default RadioGroupField;
