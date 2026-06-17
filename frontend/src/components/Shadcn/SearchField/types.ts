import type { ComponentProps } from "react";

export interface ISearchFieldProps extends Omit<ComponentProps<"input">, "id" | "type"> {
    label?: string;
    id?: string;
    containerClassName?: string;
}
