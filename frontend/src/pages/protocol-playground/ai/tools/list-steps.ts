import type { Tool } from "./types";

interface ListStepsResult {
    steps: Array<{
        index: number;
        action_id: string;
        api: string;
        owner?: string;
        description?: string;
        unsolicited?: boolean;
        responseFor?: string | null;
        isActive: boolean;
    }>;
}

export const listStepsTool: Tool<Record<string, never>, ListStepsResult> = {
    name: "list_steps",
    description: {
        type: "function",
        function: {
            name: "list_steps",
            description:
                "List every step in the current playground flow with its action_id, api, owner, and description. Use this first to orient yourself before reading specific step code.",
            parameters: {
                type: "object",
                properties: {},
                additionalProperties: false,
            },
        },
    },
    execute: (_args, ctx) => {
        if (!ctx.config) return { steps: [] };
        const steps = ctx.config.steps.map((step, index) => ({
            index,
            action_id: step.action_id,
            api: step.api,
            owner: step.owner,
            description: step.description,
            unsolicited: step.unsolicited,
            responseFor: step.responseFor,
            isActive: step.action_id === ctx.activeApi,
        }));
        return { steps };
    },
};
