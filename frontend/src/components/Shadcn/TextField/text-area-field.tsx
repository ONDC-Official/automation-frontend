import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Textarea } from "@/components/Shadcn/ComboBox/textarea";
import { cn } from "@/lib/utils";

import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import type { ITextAreaFieldProps } from "./types";

const buildValidationRules = <T extends FieldValues>(
    required: ITextAreaFieldProps<T>["required"],
    validations?: RegisterOptions<T>,
    rules?: RegisterOptions<T>
) => ({
    required: required ? (typeof required === "string" ? required : "Field required") : false,
    ...validations,
    ...rules,
});

export const TextAreaField = <T extends FieldValues = FieldValues>({
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
    strip = false,
    disable = false,
    validations,
    labelInfo: _labelInfo,
    className,
    setValue: _setValue,
    ...textareaProps
}: ITextAreaFieldProps<T> & { setValue?: unknown }) => {
    const fieldId = id ?? name;
    const fieldError =
        error ?? (name && errors?.[name]?.message ? String(errors[name]?.message) : undefined);

    const validationRules = buildValidationRules(required, validations, rules);

    const fieldLayout = (textareaNode: React.ReactNode, resolvedError = fieldError) => (
        <Field data-invalid={!!resolvedError} className="w-full">
            {label && (
                <FieldLabel htmlFor={fieldId} className="font-semibold">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </FieldLabel>
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            {textareaNode}
            {resolvedError && <FieldError>{resolvedError}</FieldError>}
        </Field>
    );

    const sharedTextareaProps = {
        id: fieldId,
        disabled: disable,
        className: cn("min-h-40 w-full", className),
        onFocus: (event: React.FocusEvent<HTMLTextAreaElement>) => event.stopPropagation(),
        onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => event.stopPropagation(),
    };

    if (control && name) {
        return (
            <Controller
                name={name as FieldPath<T>}
                control={control}
                rules={validationRules as RegisterOptions<T, FieldPath<T>>}
                render={({ field, fieldState }) =>
                    fieldLayout(
                        <Textarea
                            {...sharedTextareaProps}
                            aria-invalid={!!fieldState.error?.message}
                            name={field.name}
                            value={(field.value as string) ?? ""}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            onChange={(event) => {
                                let nextValue = event.target.value;
                                if (strip) {
                                    nextValue = nextValue.replace(/\s+/g, "");
                                }
                                field.onChange(nextValue);
                            }}
                        />,
                        fieldState.error?.message
                    )
                }
            />
        );
    }

    const registration =
        register && name
            ? register(name as FieldPath<T>, validationRules as RegisterOptions<T, FieldPath<T>>)
            : undefined;

    if (registration) {
        return fieldLayout(
            <Textarea
                {...sharedTextareaProps}
                {...textareaProps}
                aria-invalid={!!fieldError}
                name={registration.name}
                ref={registration.ref}
                onBlur={registration.onBlur}
                onChange={(event) => {
                    if (strip) {
                        event.target.value = event.target.value.replace(/\s+/g, "");
                    }
                    registration.onChange(event);
                    textareaProps.onChange?.(event);
                }}
            />
        );
    }

    return fieldLayout(
        <Textarea {...sharedTextareaProps} {...textareaProps} aria-invalid={!!fieldError} />
    );
};

export default TextAreaField;
