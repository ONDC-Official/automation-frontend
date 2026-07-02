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
