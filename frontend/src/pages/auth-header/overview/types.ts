import type { ReactNode } from "react";

export interface FlowStep {
    label: string;
    bgColor: string;
    textColor: string;
}

export interface AlgorithmInfo {
    title: string;
    description: string;
    icon: ReactNode;
    iconBgColor: string;
    iconTextColor: string;
    details: Array<{ label: string; value: string }>;
    codeExample: string;
}

export interface ScenarioRow {
    [key: string]: string | ReactNode;
}

export interface ScenarioTableProps {
    title: string;
    emoji: string;
    headers: string[];
    rows: ScenarioRow[];
    note?: ReactNode;
}
export interface CryptoAlgorithmCardProps {
    algorithm: AlgorithmInfo;
}

export interface ProcessFlowSectionProps {
    title: string;
    steps: FlowStep[];
}
