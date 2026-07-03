import type { ReactElement } from "react";

export type StepperStep = {
    icon: ReactElement;
    label: string;
};

export type StepperProps = {
    steps: StepperStep[];
    currentStep: number; // Zero-based index
};
