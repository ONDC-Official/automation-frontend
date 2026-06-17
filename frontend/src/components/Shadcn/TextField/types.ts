import type { ComponentProps } from "react";

export interface ITextFieldProps extends Omit<ComponentProps<"input">, "id"> {
    label?: string;
    id?: string;
    required?: boolean;
    error?: string;
    description?: string;
}
