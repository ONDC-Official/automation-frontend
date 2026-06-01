import type { ExecutionResult } from "@ondc/automation-mock-runner";

import { stringifyResult } from "./truncate";
import type { Tool } from "./types";

const DEFAULT_TAIL = 20;
const MAX_TAIL = 50;
const PER_RESULT_PAYLOAD_MAX_CHARS = 4_000;

interface ReadTerminalArgs {
    tail?: number;
}

interface ReadTerminalResult {
    count: number;
    entries: Array<{
        index: number;
        timestamp: string;
        success: boolean;
        executionTime?: number;
        error?: ExecutionResult["error"];
        validation: ExecutionResult["validation"];
        logs: ExecutionResult["logs"];
        result?: string;
    }>;
}

export const readTerminalTool: Tool<ReadTerminalArgs, ReadTerminalResult> = {
    name: "read_terminal",
    description: {
        type: "function",
        function: {
            name: "read_terminal",
            description:
                "Return the most recent execution results from the playground terminal. Each entry includes success/error, validation, console logs, and a possibly-truncated result payload.",
            parameters: {
                type: "object",
                properties: {
                    tail: {
                        type: "integer",
                        minimum: 1,
                        maximum: MAX_TAIL,
                        description: `How many most-recent entries to return (default ${DEFAULT_TAIL}, max ${MAX_TAIL}).`,
                    },
                },
                additionalProperties: false,
            },
        },
    },
    execute: (args, ctx) => {
        const requested = args.tail ?? DEFAULT_TAIL;
        const tail = Math.min(Math.max(requested, 1), MAX_TAIL);
        const all = ctx.terminalTail;
        const sliced = all.slice(-tail);
        const offset = all.length - sliced.length;
        const entries = sliced.map((entry, i) => ({
            index: offset + i,
            timestamp: entry.timestamp,
            success: entry.success,
            executionTime: entry.executionTime,
            error: entry.error,
            validation: entry.validation,
            logs: entry.logs,
            result:
                entry.result === undefined
                    ? undefined
                    : stringifyResult(entry.result, PER_RESULT_PAYLOAD_MAX_CHARS),
        }));
        return { count: all.length, entries };
    },
};
