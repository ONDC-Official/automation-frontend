export interface IAccordionStep {
    key: string;
    label: string;
    description?: string;
    descriptionType?: "text" | "code";
}

export interface IAccordionProps {
    title: string;
    steps: IAccordionStep[];
}
