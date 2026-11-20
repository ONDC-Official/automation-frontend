import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { Controller } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Input } from "@components/Shadcn/Input";

import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { FieldTooltip } from "./field-tooltip";
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
    tooltip,
    floatingLabel = false,
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

        if (floatingLabel && label) {
            // The label comes after the input so it can follow the input's state with
            // CSS alone: centred while empty, small at the top once typed in or focused.
            return (
                <Field data-invalid={!!resolvedError} className="w-full">
                    <div className="relative">
                        {inputNode}
                        <label
                            htmlFor={fieldId}
                            className="pointer-events-none absolute top-2 left-3 text-caption-1 text-text-secondary transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-body-1 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-caption-1"
                        >
                            {label}
                            {required && <span className="ml-0.5 text-destructive">*</span>}
                        </label>
                        {tooltip ? (
                            <span className="absolute top-1/2 right-3 flex -translate-y-1/2">
                                <FieldTooltip label={label} content={tooltip} />
                            </span>
                        ) : null}
                    </div>
                    {description && <FieldDescription>{description}</FieldDescription>}
                    {resolvedError && <FieldError>{resolvedError}</FieldError>}
                </Field>
            );
        }

        return (
            <Field data-invalid={!!resolvedError} className="w-full">
                {label && tooltip ? (
                    <div className="flex items-center gap-1.5">
                        <FieldLabel htmlFor={fieldId} className="font-semibold">
                            {label}
                            {required && <span className="text-destructive">*</span>}
                        </FieldLabel>
                        <FieldTooltip label={label} content={tooltip} />
                    </div>
                ) : label ? (
                    <FieldLabel htmlFor={fieldId} className="font-semibold">
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </FieldLabel>
                ) : null}
                {description && <FieldDescription>{description}</FieldDescription>}
                {inputNode}
                {resolvedError && <FieldError>{resolvedError}</FieldError>}
            </Field>
        );
    };

    const sharedInputProps = {
        id: fieldId,
        disabled: disable,
        className: cn(
            "w-full",
            floatingLabel &&
                "peer h-13 rounded-lg bg-n-0 px-3 pt-5 pb-1 text-base shadow-none placeholder:text-transparent focus:placeholder:text-text-secondary md:text-base dark:bg-surface-muted",
            floatingLabel && tooltip && "pr-10",
            className
        ),
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

export default TextField;

export { TextAreaField } from "@/components/Shadcn/TextArea";
export { LabelToolTip, LabelWithToolTip, type ILabelWithToolTipProps } from "./label-with-tooltip";
export type { ITextFieldProps, ITextAreaFieldProps } from "./types";
