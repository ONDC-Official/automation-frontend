import type { FlowStep } from "./types";

export function getActionId(step: FlowStep): string {
    return step.action_id ?? step.api;
}
