import type { ComponentProps } from "react";
import type {
    Control,
    FieldErrors,
    FieldPath,
    FieldValues,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";

export interface IRhfFieldProps<T extends FieldValues = FieldValues> {
    name?: FieldPath<T>;
    register?: UseFormRegister<T>;
    control?: Control<T>;
    errors?: FieldErrors<T>;
    rules?: RegisterOptions<T>;
}

export interface ITextFieldProps<T extends FieldValues = FieldValues>
    extends Omit<ComponentProps<"input">, "id" | "name" | "required">, IRhfFieldProps<T> {
    label?: string;
    id?: string;
    required?: boolean | string;
    error?: string;
    description?: string;
    labelInfo?: string;
    /** Optional help text shown from an "i" icon next to the label. */
    tooltip?: string;
    /**
     * Label inside the box (like placeholder text) that moves up small once the
     * field has a value or focus; a tooltip then sits inside the box on the right.
     */
    floatingLabel?: boolean;
    strip?: boolean;
    disable?: boolean;
    onValueChange?: (value: string) => void;
    validations?: RegisterOptions<T>;
}

export interface ITextAreaFieldProps<T extends FieldValues = FieldValues>
    extends Omit<ComponentProps<"textarea">, "id" | "name" | "required">, IRhfFieldProps<T> {
    label?: string;
    id?: string;
    required?: boolean | string;
    error?: string;
    description?: string;
    labelInfo?: string;
    strip?: boolean;
    disable?: boolean;
    validations?: RegisterOptions<T>;
}
