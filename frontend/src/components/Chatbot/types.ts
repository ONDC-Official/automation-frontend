export interface ChatbotProps {
    domain: string;
    version: string;
    flowId: string;
    actionId: string;
    actionApi: string;
}

export type KnowledgeSource = "all" | "neo4j" | "milvus";
export type ThinkingStepType = "status" | "tool" | "success" | "error";

export interface ThinkingStep {
    id: string;
    type: ThinkingStepType;
    label: string;
    detail?: string;
    expandable?: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "agent";
    text: string;
    html: string;
    thinkingSteps: ThinkingStep[];
    thinkingOpen: boolean;
    thinkingDone: boolean;
    expandedStepIds: Record<string, boolean>;
}

export interface StreamContext {
    contentStarted: boolean;
}
