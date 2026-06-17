import { MockRunner } from "@ondc/automation-mock-runner";

import type { Tool } from "./types";

type StepFile =
    | "generate"
    | "validate"
    | "requirements"
    | "defaultPayload"
    | "inputs"
    | "save-data"
    | "formHtml";

interface ReadStepCodeArgs {
    step_id: string;
    file: StepFile;
}

interface ReadStepCodeResult {
    step_id: string;
    file: StepFile;
    language: "javascript" | "json" | "html";
    content: string;
}

const FILE_LANGUAGE: Record<StepFile, "javascript" | "json" | "html"> = {
    generate: "javascript",
    validate: "javascript",
    requirements: "javascript",
    defaultPayload: "json",
    inputs: "json",
    formHtml: "html",
    "save-data": "json",
};

export const readStepCodeTool: Tool<ReadStepCodeArgs, ReadStepCodeResult> = {
    name: "read_step_code",
    description: {
        type: "function",
        function: {
            name: "read_step_code",
            description:
                "Read the source of one file inside one step. JS files are returned decoded. JSON fields are pretty-printed. Errors if formHtml is requested on a step that has none.",
            parameters: {
                type: "object",
                properties: {
                    step_id: {
                        type: "string",
                        description: "action_id of the step",
                    },
                    file: {
                        type: "string",
                        enum: [
                            "generate",
                            "validate",
                            "requirements",
                            "defaultPayload",
                            "inputs",
                            "formHtml",
                            "save-data",
                        ],
                    },
                },
                required: ["step_id", "file"],
                additionalProperties: false,
            },
        },
    },
    execute: (args, ctx) => {
        if (!ctx.config) {
            throw new Error("no playground config loaded");
        }
        const step = ctx.config.steps.find((s) => s.action_id === args.step_id);
        if (!step) {
            throw new Error(`step not found: ${args.step_id}`);
        }
        const language = FILE_LANGUAGE[args.file];
        let content: string;
        switch (args.file) {
            case "generate":
            case "validate":
            case "requirements": {
                const raw = step.mock[args.file];
                content = raw ? MockRunner.decodeBase64(raw) : "";
                break;
            }
            case "defaultPayload":
                content = JSON.stringify(step.mock.defaultPayload ?? {}, null, 2);
                break;
            case "inputs":
                content = JSON.stringify(step.mock.inputs ?? {}, null, 2);
                break;
            case "formHtml": {
                if (!step.mock.formHtml) {
                    throw new Error(`step ${args.step_id} has no formHtml (api=${step.api})`);
                }
                content = MockRunner.decodeBase64(step.mock.formHtml);
                break;
            }
            case "save-data": {
                content = JSON.stringify(step.mock.saveData ?? {}, null, 2);
                break;
            }
        }
        return {
            step_id: args.step_id,
            file: args.file,
            language,
            content,
        };
    },
};
