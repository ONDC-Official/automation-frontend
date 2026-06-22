import type { SupportedActions } from "../types";

export type ActionRelationship = "focused" | "next" | "history" | "none";

export type SupportedActionsViewMode = "cards" | "graph";

export interface SupportedActionsViewProps {
    supportedActions: SupportedActions;
}
