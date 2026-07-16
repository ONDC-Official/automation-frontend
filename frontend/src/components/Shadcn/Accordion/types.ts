export interface IAccordionStep {
    key: string;
    label: string;
    description?: string;
    /** Bullet items when `descriptionType` is `"list"` */
    items?: string[];
    descriptionType?: "text" | "code" | "list";
}

export interface IAccordionProps {
    title: string;
    steps: IAccordionStep[];
}
