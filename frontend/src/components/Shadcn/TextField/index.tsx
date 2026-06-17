import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import type { ITextFieldProps } from "./types";

export const TextField = ({
    label,
    id,
    required,
    error,
    description,
    className,
    ...inputProps
}: ITextFieldProps) => {
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

export default TextField;
