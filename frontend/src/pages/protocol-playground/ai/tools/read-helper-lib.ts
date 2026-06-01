import MockRunner from "@ondc/automation-mock-runner";

import type { Tool } from "./types";

interface ReadHelperLibResult {
    content: string;
}

export const readHelperLibTool: Tool<Record<string, never>, ReadHelperLibResult> = {
    name: "read_helper_lib",
    description: {
        type: "function",
        function: {
            name: "read_helper_lib",
            description:
                "Read the decoded shared helper library JS that is available to every step's generator/validator/requirements.",
            parameters: {
                type: "object",
                properties: {},
                additionalProperties: false,
            },
        },
    },
    execute: (_args, ctx) => {
        if (!ctx.config) {
            return { content: "" };
        }
        const raw = ctx.config.helperLib;
        const content = raw ? MockRunner.decodeBase64(raw) : "";
        return { content };
    },
};
