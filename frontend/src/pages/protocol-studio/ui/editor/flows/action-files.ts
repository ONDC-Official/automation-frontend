import {
    getFunctionSchema,
    getFunctionTemplateV2,
    MockRunnerV2,
    type FunctionNamesType,
} from "@ondc/automation-mock-runner";

import type {
    ActionFileId,
    ActionFiles,
    CodeLanguage,
} from "@pages/protocol-studio/ui/editor/types";

/** An action's files in inspector order; search walks them in this order too. */
export const ACTION_FILE_IDS: ActionFileId[] = [
    "generate",
    "validate",
    "requirements",
    "defaultPayload",
    "inputs",
];

const functionTemplate = (name: FunctionNamesType) => {
    const schema = getFunctionSchema(name);
    return schema.template(schema.defaultBody);
};

/**
 * A new node's step files. TypeScript (the default) types them from the spec:
 * `generate(defaultPayload: Payload<"search">, sessionData: SessionData)`.
 * JavaScript gives the lib's v1 templates, as published flows have them.
 * With no `api` (nothing selected) the templates are typed for `search`.
 */
export const getTemplateFiles = (
    api = "search",
    language: CodeLanguage = "typescript"
): ActionFiles => {
    const typed = language === "typescript";
    return {
        generate: typed ? getFunctionTemplateV2("generate", { api }) : functionTemplate("generate"),
        validate: typed ? getFunctionTemplateV2("validate", { api }) : functionTemplate("validate"),
        // v1 stores this as `requirements` but registers it as `meetsRequirements`.
        requirements: typed
            ? getFunctionTemplateV2("meetsRequirements", { api })
            : functionTemplate("meetsRequirements"),
        defaultPayload: "{}\n",
        inputs: "{}\n",
    };
};

/** Decodes a base64 source, or returns `fallback` when it is missing or corrupt. */
export const decodeSource = (encoded: unknown, fallback: string) => {
    if (typeof encoded !== "string" || encoded === "") return fallback;
    try {
        return MockRunnerV2.decodeBase64(encoded);
    } catch {
        return fallback;
    }
};

export const decodeHelpers = (helperLib: string) =>
    decodeSource(helperLib, "// helperLib could not be decoded");
