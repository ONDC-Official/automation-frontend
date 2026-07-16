import { ReactNode } from "react";

export interface IAccordionStep {
    key: string;
    label: string;
    description?: string;
    /** Bullet items when `descriptionType` is `"list"` */
    items?: ReactNode[];
    descriptionType?: "text" | "code" | "list";
}

export interface IAccordionProps {
    title: string;
    steps: IAccordionStep[];
}
