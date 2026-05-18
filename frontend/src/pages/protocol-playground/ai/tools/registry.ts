import type { OpenAITool } from "../client/types";

import { listStepsTool } from "./list-steps";
import { proposeStepEditTool } from "./propose-step-edit";
import { readHelperLibTool } from "./read-helper-lib";
import { readSessionDataTool } from "./read-session-data";
import { readStepCodeTool } from "./read-step-code";
import { readTerminalTool } from "./read-terminal";
import { stringifyResult } from "./truncate";
import type { Tool, ToolContext, ToolExecutionOutcome } from "./types";

const ALL_TOOLS: Tool[] = [
    listStepsTool as Tool,
    readStepCodeTool as Tool,
    readHelperLibTool as Tool,
    readSessionDataTool as Tool,
    readTerminalTool as Tool,
    proposeStepEditTool as Tool,
];

export class ToolRegistry {
    private tools: Map<string, Tool>;

    constructor(tools: Tool[]) {
        this.tools = new Map(tools.map((t) => [t.name, t]));
    }

    listDescriptions(): OpenAITool[] {
        return Array.from(this.tools.values()).map((t) => t.description);
    }

    async execute(
        name: string,
        argsJson: string,
        ctx: ToolContext
    ): Promise<ToolExecutionOutcome> {
        const tool = this.tools.get(name);
        if (!tool) {
            return { ok: false, errorText: `unknown tool: ${name}` };
        }
        let args: unknown;
        try {
            args = argsJson.trim() === "" ? {} : JSON.parse(argsJson);
        } catch (err) {
            const message = err instanceof Error ? err.message : "invalid JSON arguments";
            return { ok: false, errorText: `invalid args for ${name}: ${message}` };
        }
        try {
            const result = await tool.execute(args, ctx);
            return {
                ok: true,
                result,
                resultText: stringifyResult(result),
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "tool execution failed";
            return { ok: false, errorText: message };
        }
    }
}

export function createReadToolRegistry(): ToolRegistry {
    return new ToolRegistry(ALL_TOOLS);
}
