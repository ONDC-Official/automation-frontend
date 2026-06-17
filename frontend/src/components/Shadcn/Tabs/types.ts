import { ReactNode } from "react";

export type TabOption = {
    key: string;
    label: string | ReactNode;
};

export type FlowTabsProps = {
    options: TabOption[];
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    className?: string;
    variant?: "line" | "default";
};
