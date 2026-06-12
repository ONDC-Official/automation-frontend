import { parse as yamlParse } from "yaml";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { createCompoundSchema } from "genson-js";
import { FetchedFile } from "@pages/protocol-playground/utils/fetch-github";
import {
    ApiSchemaEntry,
    JsonSchemaObject,
    OpenApiDocument,
    buildOpenApiDocument,
} from "@pages/protocol-playground/utils/openapi-schema-builder";
import {
    ValidationConfig,
    extractJsonPaths,
} from "@pages/protocol-playground/utils/json-path-extractor";

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
 *
 * When `validationsYaml` (the branch's `config/validations/index.yaml`) is
 * provided, each api's request schema is additionally enriched with the JSON
 * paths referenced by that api's validation tests — fields the validations
 * check for but the example payloads may not cover are added to the schema.
 */
export function generateSchemasFromFiles(
    files: FetchedFile[],
    validationsYaml?: string | null
): OpenApiDocument {
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

    // api → deduped JSON paths from that api's validation tests (empty if none).
    const pathsByApi = extractValidationPaths(validationsYaml);

    const entries: ApiSchemaEntry[] = [];
    const covered = new Set<string>();
    for (const [api, { payloads, majorVersion }] of byApi) {
        if (payloads.length === 0) continue;
        const requestSchema = createCompoundSchema(payloads, { noRequired: true });
        const validationPaths = pathsByApi[api];
        if (validationPaths?.length) {
            enrichSchemaWithPaths(requestSchema as JsonSchemaObject, validationPaths);
        }
        entries.push({ api, requestSchema, majorVersion });
        covered.add(api);
    }

    // Apis found only in the validations (no example payloads in any flow file)
    // still get a path — their request schema is built purely from the JSON
    // paths their validation tests reference.
    for (const [api, validationPaths] of Object.entries(pathsByApi)) {
        if (covered.has(api) || validationPaths.length === 0) continue;
        const requestSchema: JsonSchemaObject = { type: "object", properties: {} };
        enrichSchemaWithPaths(requestSchema, validationPaths);
        entries.push({ api, requestSchema });
    }

    entries.sort((a, b) => a.api.localeCompare(b.api));

    return buildOpenApiDocument(entries);
}

/**
 * Parses the validations YAML and extracts JSON paths per api. Returns an empty
 * map for missing/invalid/non-validation YAML so schema generation is unaffected.
 */
function extractValidationPaths(validationsYaml?: string | null): Record<string, string[]> {
    if (!validationsYaml) return {};
    try {
        return extractJsonPaths(yamlParse(validationsYaml) as ValidationConfig);
    } catch {
        return {};
    }
}

type PathToken = { kind: "key"; name: string } | { kind: "index" };

/**
 * Tokenizes a normalized JSON path (e.g. `$.message.items[*].id`) into ordered
 * segments. Bracket segments (`[*]`, `[0]`, leftover filters) become array
 * descents; quoted bracket keys (`['foo']`) and dotted identifiers become keys.
 */
function tokenizeJsonPath(path: string): PathToken[] {
    const tokens: PathToken[] = [];
    let i = path.startsWith("$") ? 1 : 0;
    while (i < path.length) {
        const ch = path[i];
        if (ch === ".") {
            i++;
        } else if (ch === "[") {
            let depth = 1;
            let j = i + 1;
            while (j < path.length && depth > 0) {
                if (path[j] === "[") depth++;
                else if (path[j] === "]") depth--;
                j++;
            }
            const inner = path.slice(i + 1, j - 1).trim();
            const quoted = inner.match(/^['"](.*)['"]$/);
            tokens.push(quoted ? { kind: "key", name: quoted[1] } : { kind: "index" });
            i = j;
        } else {
            let j = i;
            while (j < path.length && path[j] !== "." && path[j] !== "[") j++;
            const name = path.slice(i, j).trim();
            if (name) tokens.push({ kind: "key", name });
            i = j;
        }
    }
    return tokens;
}

/**
 * Ensures every segment of each validation path exists in the genson-derived
 * schema, creating minimal object/array nodes where the example payloads didn't
 * cover them. The leaf of each path is assumed to be a string value (validations
 * reference scalar attributes). Existing nodes (and their example-inferred
 * types) are left untouched — this is purely additive.
 */
function enrichSchemaWithPaths(schema: JsonSchemaObject, paths: string[]): void {
    for (const path of paths) {
        let node = schema;
        for (const token of tokenizeJsonPath(path)) {
            if (token.kind === "index") {
                if (node.type === undefined) node.type = "array";
                const items = (node.items as JsonSchemaObject) ?? {};
                node.items = items;
                node = items;
            } else {
                if (node.type === undefined) node.type = "object";
                const props = (node.properties as Record<string, JsonSchemaObject>) ?? {};
                node.properties = props;
                if (!props[token.name] || typeof props[token.name] !== "object") {
                    props[token.name] = {};
                }
                node = props[token.name];
            }
        }
        // Leaf reached. Newly-created leaves are empty `{}` — type them as a
        // string. Nodes the examples already described keep their inferred shape.
        if (Object.keys(node).length === 0) node.type = "string";
    }
}
