import { parse as yamlParse } from "yaml";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { createCompoundSchema } from "genson-js";
import { FetchedFile } from "@pages/protocol-playground/utils/fetch-github";
import {
    ApiSchemaEntry,
    OpenApiDocument,
    buildOpenApiDocument,
} from "@pages/protocol-playground/utils/openapi-schema-builder";

/** Form steps carry no real ONDC payload — skip them. */
const SKIPPED_APIS = new Set(["html_form", "dynamic_form"]);

interface ContextLike {
    version?: unknown;
    core_version?: unknown;
}

/** Extracts the major version char ("1" | "2" | ...) from a payload's context. */
function extractMajorVersion(payload: unknown): string | undefined {
    const ctx = (payload as { context?: ContextLike } | null | undefined)?.context;
    const raw = ctx?.version ?? ctx?.core_version;
    if (typeof raw === "string" && raw.trim().length > 0) {
        return raw.trim().charAt(0);
    }
    return undefined;
}

/**
 * Parses every fetched YAML config and builds a single OpenAPI document.
 *
 * Each ONDC action (`step.api`) becomes a POST path. The request body schema is
 * consolidated from all of that api's example payloads (genson, `noRequired`),
 * across every file. The response schema is hardcoded per the major version
 * (context.version / context.core_version) found in the examples. Form steps
 * (`html_form`, `dynamic_form`) are skipped.
 */
export function generateSchemasFromFiles(files: FetchedFile[]): OpenApiDocument {
    const byApi = new Map<string, { payloads: unknown[]; majorVersion?: string }>();

    for (const file of files) {
        let config: MockPlaygroundConfigType | undefined;
        try {
            config = yamlParse(file.content) as MockPlaygroundConfigType;
        } catch {
            // skip files that aren't valid YAML configs
            continue;
        }

        const steps = config?.steps ?? [];
        for (const step of steps) {
            const api = step?.api;
            const examples = step?.examples ?? [];
            if (!api || SKIPPED_APIS.has(api) || examples.length === 0) continue;

            let entry = byApi.get(api);
            if (!entry) {
                entry = { payloads: [] };
                byApi.set(api, entry);
            }
            for (const ex of examples) {
                if (ex?.payload !== undefined && ex?.payload !== null) {
                    entry.payloads.push(ex.payload);
                    if (!entry.majorVersion) {
                        entry.majorVersion = extractMajorVersion(ex.payload);
                    }
                }
            }
        }
    }

    const entries: ApiSchemaEntry[] = [];
    for (const [api, { payloads, majorVersion }] of byApi) {
        if (payloads.length === 0) continue;
        entries.push({
            api,
            requestSchema: createCompoundSchema(payloads, { noRequired: true }),
            majorVersion,
        });
    }
    entries.sort((a, b) => a.api.localeCompare(b.api));

    return buildOpenApiDocument(entries);
}
