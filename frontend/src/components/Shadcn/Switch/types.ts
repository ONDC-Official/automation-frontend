import { ReactNode } from "react";

export type SwitchFieldProps = {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    info?: string;
    disabled?: boolean;
    className?: string;
};

export type SwitchFieldGroupProps = {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    layout?: "default" | "single";
};
