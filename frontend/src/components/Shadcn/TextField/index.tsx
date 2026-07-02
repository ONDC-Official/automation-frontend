import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";

import { cn } from "@/lib/utils";

import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import type { ITextFieldProps } from "./types";

const buildValidationRules = <T extends FieldValues>(
    required: ITextFieldProps<T>["required"],
    validations?: RegisterOptions<T>,
    rules?: RegisterOptions<T>
) => ({
    required: required ? (typeof required === "string" ? required : "Field required") : false,
    ...validations,
    ...rules,
});

export const TextField = <T extends FieldValues = FieldValues>({
    label,
    id,
    required,
    error,
    description,
    name,
    register,
    control,
    errors,
    rules,
    validations,
    strip = false,
    disable = false,
    onValueChange,
    labelInfo: _labelInfo,
    className,
    setValue: _setValue,
    ...inputProps
}: ITextFieldProps<T> & { setValue?: unknown }) => {
    const fieldId = id ?? name;
    const validationRules = buildValidationRules(required, validations, rules);

    const resolveError = (fieldError?: string) =>
        error ??
        fieldError ??
        (name && errors?.[name]?.message ? String(errors[name]?.message) : undefined);

    const normalizeValue = (rawValue: string) => (strip ? rawValue.replace(/\s+/g, "") : rawValue);

    const fieldLayout = (inputNode: React.ReactNode, fieldError?: string) => {
        const resolvedError = resolveError(fieldError);

        return (
            <Field data-invalid={!!resolvedError} className="w-full">
                {label && (
                    <FieldLabel htmlFor={fieldId} className="font-semibold">
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </FieldLabel>
                )}
                {description && <FieldDescription>{description}</FieldDescription>}
                {inputNode}
                {resolvedError && <FieldError>{resolvedError}</FieldError>}
            </Field>
        );
    };

    const sharedInputProps = {
        id: fieldId,
        disabled: disable,
        className: cn("w-full", className),
        placeholder: inputProps.placeholder ?? "Type here...",
        onFocus: (event: React.FocusEvent<HTMLInputElement>) => event.stopPropagation(),
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => event.stopPropagation(),
        type: inputProps.type,
        autoComplete: inputProps.autoComplete,
        min: inputProps.min,
        max: inputProps.max,
        step: inputProps.step,
        pattern: inputProps.pattern,
    };

    if (control && name) {
        return (
            <Controller
                name={name as FieldPath<T>}
                control={control}
                rules={validationRules as RegisterOptions<T, FieldPath<T>>}
                render={({ field, fieldState }) =>
                    fieldLayout(
                        <Input
                            {...sharedInputProps}
                            aria-invalid={!!resolveError(fieldState.error?.message)}
                            name={field.name}
                            value={(field.value as string) ?? ""}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            onChange={(event) => {
                                const nextValue = normalizeValue(event.target.value);
                                field.onChange(nextValue);
                                onValueChange?.(nextValue);
                            }}
                        />,
                        fieldState.error?.message
                    )
                }
            />
        );
    }

    if (register && name) {
        const registration = register(
            name as FieldPath<T>,
            validationRules as RegisterOptions<T, FieldPath<T>>
        );

        return fieldLayout(
            <Input
                {...sharedInputProps}
                {...inputProps}
                aria-invalid={!!resolveError()}
                name={registration.name}
                ref={registration.ref}
                onBlur={registration.onBlur}
                onChange={(event) => {
                    let nextValue = event.target.value;
                    if (strip) {
                        nextValue = nextValue.replace(/\s+/g, "");
                        event.target.value = nextValue;
                    }
                    registration.onChange(event);
                    onValueChange?.(nextValue);
                }}
            />
        );
    }

    return fieldLayout(
        <Input {...sharedInputProps} {...inputProps} aria-invalid={!!resolveError()} />
    );
};

export { TextAreaField } from "./text-area-field";
export { LabelToolTip, LabelWithToolTip, type ILabelWithToolTipProps } from "./label-with-tooltip";
export type { ITextFieldProps, ITextAreaFieldProps } from "./types";
export default TextField;
