import type { ComponentProps } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface IProps extends Omit<ComponentProps<"input">, "id" | "type"> {
    label: string;
    /** the result of react-hook-form's `register(...)` */
    registration?: UseFormRegisterReturn;
    error?: string;
    hint?: string;
    className?: string;
}
