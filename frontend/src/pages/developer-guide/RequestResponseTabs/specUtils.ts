import type { OpenAPISpecification, OpenAPISchema } from "../types";

/**
 * Resolves a JSON Pointer / $ref string (e.g. "#/components/schemas/Foo"
 * or "#/paths/~1init/post/responses/default") to the value inside `spec`.
 */
export function resolveRef(spec: OpenAPISpecification, ref: string): unknown {
    if (!ref.startsWith("#/")) return undefined;
    const parts = ref
        .slice(2) // remove "#/"
        .split("/")
        .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
    let cur: unknown = spec;
    for (const part of parts) {
        if (cur == null || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
}

/**
 * Converts an OpenAPI schema node (potentially a `$ref`) into a concrete
 * schema object, merging `allOf` fragments.  Stops at a configurable depth
 * to prevent infinite recursion on circular schemas.
 */
export function resolveSchema(
    spec: OpenAPISpecification,
    schema: OpenAPISchema | undefined | null,
    depth = 0
): OpenAPISchema | null {
    if (!schema || depth > 10) return null;

    // Follow $ref
    if (schema.$ref) {
        const resolved = resolveRef(spec, schema.$ref);
        if (!resolved || typeof resolved !== "object") return null;
        return resolveSchema(spec, resolved as OpenAPISchema, depth + 1);
    }

    // Merge allOf fragments into a single schema
    if (schema.allOf && Array.isArray(schema.allOf)) {
        const merged: OpenAPISchema = { ...schema };
        delete merged.allOf;

        for (const fragment of schema.allOf) {
            if (!fragment || typeof fragment !== "object") continue;
            const resolved = resolveSchema(spec, fragment as OpenAPISchema, depth + 1);
            if (!resolved) continue;

            // Merge top-level fields; properties are merged shallowly
            if (resolved.properties) {
                merged.properties = { ...(merged.properties ?? {}), ...resolved.properties };
            }
            if (resolved.required) {
                const existing = Array.isArray(merged.required) ? merged.required : [];
                const incoming = Array.isArray(resolved.required) ? resolved.required : [];
                merged.required = Array.from(new Set([...existing, ...incoming]));
            }
            // Carry over description/type if missing from the base
            if (!merged.description && resolved.description) {
                merged.description = resolved.description;
            }
            if (!merged.type && resolved.type) {
                merged.type = resolved.type;
            }
        }
        return merged;
    }

    return schema;
}

/**
 * Deeply resolves an arbitrary JSON value, following every `$ref` and
 * merging every `allOf` so the result contains no `$ref` or `allOf` keys.
 * Cycle detection prevents infinite loops on self-referencing schemas.
 */
export function deepResolveSchema(
    spec: OpenAPISpecification,
    node: unknown,
    _visited: ReadonlySet<string> = new Set()
): unknown {
    if (node == null || typeof node !== "object") return node;

    if (Array.isArray(node)) {
        return node.map((item) => deepResolveSchema(spec, item, _visited));
    }

    const obj = node as Record<string, unknown>;

    // Follow $ref — with cycle guard
    if (typeof obj.$ref === "string") {
        const ref = obj.$ref;
        if (_visited.has(ref)) return { "«ref»": ref }; // cycle — keep a hint
        const resolved = resolveRef(spec, ref);
        if (!resolved) return { "«unresolved»": ref };
        return deepResolveSchema(spec, resolved, new Set([..._visited, ref]));
    }

    // Merge allOf into the current object first
    const merged: Record<string, unknown> = { ...obj };
    if (Array.isArray(merged.allOf)) {
        const fragments = merged.allOf as unknown[];
        delete merged.allOf;
        for (const fragment of fragments) {
            const r = deepResolveSchema(spec, fragment, _visited);
            if (!r || typeof r !== "object" || Array.isArray(r)) continue;
            const rf = r as Record<string, unknown>;
            if (rf.properties) {
                merged.properties = {
                    ...((merged.properties as object | undefined) ?? {}),
                    ...(rf.properties as object),
                };
            }
            if (Array.isArray(rf.required)) {
                const base = Array.isArray(merged.required) ? (merged.required as string[]) : [];
                merged.required = Array.from(new Set([...base, ...(rf.required as string[])]));
            }
            if (!merged.description && rf.description) merged.description = rf.description;
            if (!merged.type && rf.type) merged.type = rf.type;
            if (!merged.enum && rf.enum) merged.enum = rf.enum;
        }
    }

    // Recursively resolve all remaining fields (skip meta-noise)
    const SKIP = new Set(["$ref", "allOf"]);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(merged)) {
        if (SKIP.has(key)) continue;
        result[key] = deepResolveSchema(spec, val, _visited);
    }
    return result;
}

/** Extract the request body schema for a given API action (e.g. "search"). */
export function getRequestSchema(spec: OpenAPISpecification, api: string): OpenAPISchema | null {
    const pathKey = api.startsWith("/") ? api : `/${api}`;
    const pathItem = spec.paths?.[pathKey];
    if (!pathItem) return null;

    // ONDC APIs are always POST
    const schema = pathItem["post"]?.requestBody?.content?.["application/json"]?.schema;
    return resolveSchema(spec, schema as OpenAPISchema | undefined);
}

/** Extract the response schema for a given API action. */
export function getResponseSchema(spec: OpenAPISpecification, api: string): OpenAPISchema | null {
    const pathKey = api.startsWith("/") ? api : `/${api}`;
    const pathItem = spec.paths?.[pathKey];
    if (!pathItem) return null;

    const postOp = pathItem["post"];
    if (!postOp?.responses) return null;

    const responses = postOp.responses as Record<string, unknown>;

    // Prefer status 200 / 201 / default
    for (const code of ["200", "201", "default"]) {
        let responseObj = responses[code];
        if (!responseObj) continue;

        // Resolve $ref on the whole response object
        if (typeof responseObj === "object" && (responseObj as Record<string, unknown>)["$ref"]) {
            const ref = (responseObj as Record<string, unknown>)["$ref"] as string;
            responseObj = resolveRef(spec, ref) ?? responseObj;
        }

        if (!responseObj || typeof responseObj !== "object") continue;

        const schema = (responseObj as Record<string, unknown>)["content"] as
            | Record<string, { schema?: OpenAPISchema }>
            | undefined;

        if (!schema) continue;

        // Try application/json first, then any key
        const mediaSchema = schema["application/json"]?.schema ?? Object.values(schema)[0]?.schema;

        if (mediaSchema) {
            return resolveSchema(spec, mediaSchema);
        }
    }
    return null;
}

/**
 * Extract response examples from spec.  Looks in:
 *  - responses[code].content[media].examples  (plural, named object)
 *  - responses[code].content[media].example   (singular value)
 */
export function getResponseExamples(
    spec: OpenAPISpecification,
    api: string
): Array<{ name: string; payload: unknown }> {
    const pathKey = api.startsWith("/") ? api : `/${api}`;
    const pathItem = spec.paths?.[pathKey];
    if (!pathItem) return [];

    const postOp = pathItem["post"];
    if (!postOp?.responses) return [];

    const responses = postOp.responses as Record<string, unknown>;
    const results: Array<{ name: string; payload: unknown }> = [];

    for (const code of ["200", "201", "default"]) {
        let responseObj = responses[code];
        if (!responseObj) continue;

        if (typeof responseObj === "object" && (responseObj as Record<string, unknown>)["$ref"]) {
            const ref = (responseObj as Record<string, unknown>)["$ref"] as string;
            responseObj = resolveRef(spec, ref) ?? responseObj;
        }

        if (!responseObj || typeof responseObj !== "object") continue;

        const content = (responseObj as Record<string, unknown>)["content"] as
            | Record<string, Record<string, unknown>>
            | undefined;
        if (!content) continue;

        for (const mediaContent of Object.values(content)) {
            // Plural examples: { exampleKey: { value: {...}, summary?: '...' } }
            const pluralExamples = mediaContent["examples"] as
                | Record<string, { value?: unknown; summary?: string }>
                | undefined;
            if (pluralExamples && typeof pluralExamples === "object") {
                for (const [key, ex] of Object.entries(pluralExamples)) {
                    if (ex?.value != null) {
                        results.push({
                            name: ex.summary ?? key,
                            payload: ex.value,
                        });
                    }
                }
                if (results.length) return results;
            }

            // Singular example
            const singleExample = mediaContent["example"];
            if (singleExample != null) {
                results.push({ name: "Response Example", payload: singleExample });
                return results;
            }
        }
    }

    return results;
}
