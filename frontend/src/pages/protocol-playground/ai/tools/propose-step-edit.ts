import type { Tool } from "./types";

type EditableFile = "generate" | "validate" | "requirements" | "formHtml";

interface ProposeStepEditArgs {
    step_id: string;
    file: EditableFile;
    new_code: string;
    rationale: string;
}

interface ProposeStepEditResult {
    applied: boolean;
    step_id: string;
    file: EditableFile;
}

const EDITABLE_FILES: EditableFile[] = ["generate", "validate", "requirements", "formHtml"];

export const proposeStepEditTool: Tool<ProposeStepEditArgs, ProposeStepEditResult> = {
    name: "propose_step_edit",
    description: {
        type: "function",
        function: {
            name: "propose_step_edit",
            description:
                "Propose an edit to one source file in one step. The user must explicitly Approve or Reject before any change is applied. Only the four editable files (generate, validate, requirements, formHtml) are supported. Always read_step_code first; supply the entire new file content (not a patch); include a one-line rationale.",
            parameters: {
                type: "object",
                properties: {
                    step_id: {
                        type: "string",
                        description: "action_id of the target step",
                    },
                    file: {
                        type: "string",
                        enum: EDITABLE_FILES,
                        description: "Which file to edit",
                    },
                    new_code: {
                        type: "string",
                        description:
                            "The complete new file contents (NOT a patch). Will replace the existing file verbatim if approved.",
                    },
                    rationale: {
                        type: "string",
                        description:
                            "One short sentence explaining what the edit does and why.",
                    },
                },
                required: ["step_id", "file", "new_code", "rationale"],
                additionalProperties: false,
            },
        },
    },
    execute: async (args, ctx) => {
        if (!ctx.config) throw new Error("no playground config loaded");
        if (!ctx.toolCallId) throw new Error("missing tool call id");
        if (!ctx.requestApproval)
            throw new Error("approval system not wired into this context");
        if (!ctx.updateStepMock)
            throw new Error("step write path not wired into this context");
        if (!EDITABLE_FILES.includes(args.file)) {
            throw new Error(
                `file '${args.file}' is not editable; choose one of ${EDITABLE_FILES.join(", ")}`
            );
        }

        const step = ctx.config.steps.find((s) => s.action_id === args.step_id);
        if (!step) throw new Error(`step not found: ${args.step_id}`);
        if (args.file === "formHtml" && !step.mock.formHtml) {
            throw new Error(
                `step ${args.step_id} has no formHtml (api=${step.api}) — cannot edit it`
            );
        }

        const outcome = await ctx.requestApproval(ctx.toolCallId, {
            step_id: args.step_id,
            file: args.file,
            new_code: args.new_code,
            rationale: args.rationale,
        });
        if (outcome.applied) {
            ctx.updateStepMock(args.step_id, args.file, args.new_code);
        }
        return {
            applied: outcome.applied,
            step_id: args.step_id,
            file: args.file,
        };
    },
};
