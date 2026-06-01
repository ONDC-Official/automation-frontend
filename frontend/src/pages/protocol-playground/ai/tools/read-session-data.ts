import MockRunner from "@ondc/automation-mock-runner";

import type { Tool } from "./types";

interface ReadSessionDataArgs {
    step_id: string;
}

interface ReadSessionDataResult {
    step_id: string;
    sessionData: Record<string, unknown>;
}

export const readSessionDataTool: Tool<ReadSessionDataArgs, ReadSessionDataResult> = {
    name: "read_session_data",
    description: {
        type: "function",
        function: {
            name: "read_session_data",
            description:
                "Read accumulated session data up to and including the given step. Reflects whatever prior steps have produced into transaction_history.",
            parameters: {
                type: "object",
                properties: {
                    step_id: {
                        type: "string",
                        description: "action_id of the step to fetch session data for",
                    },
                },
                required: ["step_id"],
                additionalProperties: false,
            },
        },
    },
    execute: async (args, ctx) => {
        if (!ctx.config) {
            throw new Error("no playground config loaded");
        }
        const index = ctx.config.steps.findIndex((s) => s.action_id === args.step_id);
        if (index < 0) {
            throw new Error(`step not found: ${args.step_id}`);
        }
        const runner = new MockRunner(ctx.config, true);
        const sessionData = await runner.getSessionDataUpToStep(index);
        return { step_id: args.step_id, sessionData };
    },
};
