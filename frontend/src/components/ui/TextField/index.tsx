import * as React from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";

export type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
    label: string;
    id?: string;
    required?: boolean;
    error?: string;
    description?: string;
};

export const TextField = ({
    label,
    id,
    required,
    error,
    description,
    className,
    ...inputProps
}: TextFieldProps) => {
    const fieldId = id ?? inputProps.name;

    return (
        <Field data-invalid={!!error}>
            <FieldLabel htmlFor={fieldId} className="font-semibold">
                {label}
                {required && <span className="text-destructive">*</span>}
            </FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <Input
                id={fieldId}
                className={cn("w-full", className)}
                aria-invalid={!!error}
                {...inputProps}
            />
            {error && <FieldError>{error}</FieldError>}
        </Field>
    );
};

/** @deprecated Use TextField */
export const InputField = TextField;
