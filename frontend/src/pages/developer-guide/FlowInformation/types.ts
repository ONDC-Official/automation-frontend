import type { OpenAPISpecification, FlowEntry } from "../types";

export type FlowInformationSection = "preview" | "x-validations" | "request" | "response";

export interface FlowInformationProps {
    data: OpenAPISpecification;
    flows: FlowEntry[];
    selectedFlow: string;
    setSelectedFlow: (flowId: string) => void;
    selectedFlowAction: string;
    setSelectedFlowAction: (actionId: string) => void;
    domain: string;
    version: string;
}

export interface FlowExample {
    name: string;
    payload: unknown;
}
