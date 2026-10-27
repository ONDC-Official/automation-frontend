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
    "match",
    "exit",
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
        match: typed ? getFunctionTemplateV2("match", { api }) : functionTemplate("match"),
        exit: typed ? getFunctionTemplateV2("exit", { api }) : functionTemplate("exit"),
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

/**
 * A `match` that tells nothing apart: empty, or the untouched template (which
 * returns true). Such a node accepts any payload of its API, so two of them
 * behind one fork can't be distinguished.
 */
export const isDefaultMatch = (
    match: string | undefined,
    api: string,
    language: CodeLanguage = "typescript"
) => {
    const source = (match ?? "").trim();
    if (source === "") return true;
    return source === getTemplateFiles(api, language).match.trim();
};

export const decodeHelpers = (helperLib: string) =>
    decodeSource(helperLib, "// helperLib could not be decoded");

/**
 * The session keys v1's `getDefaultStep` gives every new step, so the context
 * of the next steps can be derived from what was sent (`transactionId`,
 * `latestMessage_id`, bap / bpp ids, the city). `city_code`'s path depends on
 * the spec's major version (1.x has `context.city`).
 */
export const getDefaultSaveData = (version: string): Record<string, string> => ({
    transactionId: "$.context.transaction_id",
    latestMessage_id: "$.context.message_id",
    latestTimestamp: "$.context.timestamp",
    bapId: "$.context.bap_id",
    bapUri: "$.context.bap_uri",
    bppId: "$.context.bpp_id",
    bppUri: "$.context.bpp_uri",
    city_code: version.startsWith("1") ? "$.context.city" : "$.context.location.city.code",
});
