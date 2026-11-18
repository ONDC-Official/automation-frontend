/**
 * The OpenAPI spec (`config/specs/openapi.yaml`) as browsable request schemas.
 *
 * The pointer helpers mirror mock-runner-lib's `v2/typegen/spec.ts`
 * (`getRequestSchemaPointer`, `resolvePointer`, `derefPointer`), which the
 * lib doesn't export.
 */

export type SpecJson = {
    paths?: Record<string, unknown>;
    components?: { schemas?: Record<string, unknown> } & Record<string, unknown>;
} & Record<string, unknown>;

type Schema = Record<string, unknown>;

/** JSON Pointer token escaping (RFC 6901). */
export const escapePointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");
export const unescapePointerToken = (token: string) =>
    token.replace(/~1/g, "/").replace(/~0/g, "~");

/** The pointer to an API's request body schema, e.g. `#/paths/~1search/post/requestBody/…`. */
export const getRequestSchemaPointer = (api: string) =>
    `#/paths/${escapePointerToken(`/${api}`)}/post/requestBody/content/${escapePointerToken("application/json")}/schema`;

/** Resolves a local `#/…` pointer against the spec; undefined when it doesn't resolve. */
export const resolvePointer = (spec: unknown, pointer: string): unknown => {
    if (!pointer.startsWith("#")) return undefined;
    let node: unknown = spec;
    for (const raw of pointer.slice(1).split("/").slice(1)) {
        if (node === null || typeof node !== "object") return undefined;
        node = (node as Record<string, unknown>)[unescapePointerToken(raw)];
    }
    return node;
};

/** A pointer's steps, unescaped (`#/a/b~1c` → `["a", "b/c"]`). */
export const pointerSteps = (pointer: string) =>
    pointer.startsWith("#/") ? pointer.slice(2).split("/").map(unescapePointerToken) : [];

const asSchema = (value: unknown): Schema | null =>
    value && typeof value === "object" && !Array.isArray(value) ? (value as Schema) : null;

/** The apis the spec has a request schema for (path without its `/`), in file order. */
export const getSpecApis = (spec: SpecJson): string[] =>
    Object.keys(spec.paths ?? {}).flatMap((path) => {
        const schema = resolvePointer(spec, getRequestSchemaPointer(path.slice(1)));
        return path.startsWith("/") && schema ? [path.slice(1)] : [];
    });

/** The component name a `#/components/schemas/X` ref names. */
const componentName = (ref: string) => {
    const match = /^#\/components\/schemas\/([^/]+)$/.exec(ref);
    return match ? unescapePointerToken(match[1] as string) : undefined;
};

/** A schema with `$ref`s followed and `allOf` folded in. */
interface Merged {
    type?: string;
    properties: Map<string, { schema: unknown; pointer: string }>;
    required: Set<string>;
    items?: { schema: unknown; pointer: string };
    enum?: unknown[];
    pattern?: string;
    format?: string;
    description?: string;
    refName?: string;
    /** Properties some `oneOf` / `anyOf` branch adds. */
    partial: boolean;
    /** Pointers of every schema folded in (cycle detection). */
    pointers: string[];
}

const merge = (
    spec: unknown,
    schema: unknown,
    pointer: string,
    seen: Set<string>,
    out: Merged,
    depth = 0
) => {
    let node = asSchema(schema);
    let at = pointer;
    while (node && typeof node.$ref === "string") {
        const ref = node.$ref;
        if (seen.has(ref)) return;
        seen.add(ref);
        out.refName ??= componentName(ref);
        at = ref;
        node = asSchema(resolvePointer(spec, ref));
    }
    if (!node || depth > 12) return;
    out.pointers.push(at);
    if (typeof node.type === "string") out.type ??= node.type;
    if (Array.isArray(node.enum)) out.enum ??= node.enum;
    if (typeof node.pattern === "string") out.pattern ??= node.pattern;
    if (typeof node.format === "string") out.format ??= node.format;
    if (typeof node.description === "string") out.description ??= node.description;
    const props = asSchema(node.properties);
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (!out.properties.has(key)) {
                out.properties.set(key, {
                    schema: value,
                    pointer: `${at}/properties/${escapePointerToken(key)}`,
                });
            } else {
                // Two branches describe the same property (allOf narrowing, e.g. context.action's enum).
                const existing = out.properties.get(key)!;
                out.properties.set(key, {
                    schema: { allOf: [existing.schema, value] },
                    pointer: existing.pointer,
                });
            }
        }
        out.type ??= "object";
    }
    if (Array.isArray(node.required))
        for (const key of node.required) if (typeof key === "string") out.required.add(key);
    if (node.items !== undefined) {
        out.items ??= { schema: node.items, pointer: `${at}/items` };
        out.type ??= "array";
    }
    if (Array.isArray(node.allOf)) {
        node.allOf.forEach((branch, i) =>
            merge(spec, branch, `${at}/allOf/${i}`, new Set(seen), out, depth + 1)
        );
    }
    for (const key of ["oneOf", "anyOf"] as const) {
        const branches = node[key];
        if (!Array.isArray(branches)) continue;
        branches.forEach((branch, i) => {
            const part: Merged = {
                properties: new Map(),
                required: new Set(),
                partial: false,
                pointers: [],
            };
            merge(spec, branch, `${at}/${key}/${i}`, new Set(seen), part, depth + 1);
            for (const [name, value] of part.properties)
                if (!out.properties.has(name)) out.properties.set(name, value);
            out.type ??= part.type;
            out.items ??= part.items;
            out.enum ??= part.enum;
            if (part.properties.size) out.partial = true;
        });
    }
};

const mergeSchema = (spec: unknown, schema: unknown, pointer: string): Merged => {
    const out: Merged = {
        properties: new Map(),
        required: new Set(),
        partial: false,
        pointers: [],
    };
    merge(spec, schema, pointer, new Set(), out);
    return out;
};

export interface SchemaNode {
    /** Property name; the root is the api. */
    key: string;
    /** Canonical JSONPath of the field (`$.message.order.items[*].id`), as validations are indexed. */
    path: string;
    /** Where the field's schema is written (for Source). */
    pointer: string;
    refName?: string;
    /** `object`, `string`, … ; arrays read `Item[]` / `string[]`. */
    type: string;
    isArray: boolean;
    required: boolean;
    enum?: unknown[];
    pattern?: string;
    format?: string;
    description?: string;
    /** Some properties only exist in one `oneOf` / `anyOf` branch. */
    partial: boolean;
    /** The schema refers back to one it's inside of: not expanded. */
    cyclic: boolean;
    hasChildren: boolean;
    /** @internal lazy expansion state. */
    merged: Merged;
    ancestors: string[];
}

const toNode = (
    spec: unknown,
    key: string,
    path: string,
    pointer: string,
    merged: Merged,
    required: boolean,
    ancestors: string[]
): SchemaNode => {
    let isArray = false;
    let shape = merged;
    let label = merged.type ?? (merged.properties.size ? "object" : "any");
    if (merged.items) {
        isArray = true;
        shape = mergedAt(spec, merged.items.schema, merged.items.pointer);
        label = `${shape.refName ?? shape.type ?? "any"}[]`;
    } else if (merged.refName) {
        label = merged.refName;
    }
    const cyclic = shape.pointers.some((p) => ancestors.includes(p)) && shape.properties.size > 0;
    return {
        key,
        path,
        pointer,
        refName: shape.refName ?? merged.refName,
        type: label,
        isArray,
        required,
        enum: shape.enum ?? merged.enum,
        pattern: shape.pattern ?? merged.pattern,
        format: shape.format ?? merged.format,
        description: merged.description ?? shape.description,
        partial: shape.partial,
        cyclic,
        hasChildren: !cyclic && shape.properties.size > 0,
        merged: shape,
        ancestors: [...ancestors, ...shape.pointers],
    };
};

const mergeCaches = new WeakMap<object, Map<string, Merged>>();

/** The merged schema at `pointer`, cached per spec object. */
const mergedAt = (spec: unknown, schema: unknown, pointer: string) => {
    const owner = (spec ?? mergeCaches) as object;
    let cache = mergeCaches.get(owner);
    if (!cache) {
        cache = new Map();
        mergeCaches.set(owner, cache);
    }
    const hit = cache.get(pointer);
    if (hit) return hit;
    const merged = mergeSchema(spec, schema, pointer);
    cache.set(pointer, merged);
    return merged;
};

/** The api's request schema as a tree root (`$`), or null when the spec has none. */
export const getSchemaRoot = (spec: SpecJson, api: string): SchemaNode | null => {
    const pointer = getRequestSchemaPointer(api);
    const schema = resolvePointer(spec, pointer);
    if (!schema) return null;
    return toNode(spec, api, "$", pointer, mergedAt(spec, schema, pointer), true, []);
};

/** A component schema (`#/components/schemas/X`) as a tree root. */
export const getComponentRoot = (spec: SpecJson, name: string): SchemaNode | null => {
    const pointer = `#/components/schemas/${escapePointerToken(name)}`;
    const schema = resolvePointer(spec, pointer);
    if (!schema) return null;
    return toNode(spec, name, "$", pointer, mergedAt(spec, schema, pointer), false, []);
};

export const getSchemaChildren = (spec: SpecJson, node: SchemaNode): SchemaNode[] => {
    if (!node.hasChildren) return [];
    const base = node.isArray ? `${node.path}[*]` : node.path;
    return [...node.merged.properties].map(([key, { schema, pointer }]) =>
        toNode(
            spec,
            key,
            `${base}.${key}`,
            pointer,
            mergedAt(spec, schema, pointer),
            node.merged.required.has(key),
            node.ancestors
        )
    );
};

/** Every field path of an api's request (depth first, at most `cap`), for path suggestions. */
export const listSchemaPaths = (spec: SpecJson, api: string, cap = 2000): string[] => {
    const root = getSchemaRoot(spec, api);
    if (!root) return [];
    const out: string[] = [];
    const walk = (node: SchemaNode, depth: number) => {
        for (const child of getSchemaChildren(spec, node)) {
            if (out.length >= cap) return;
            out.push(child.isArray ? `${child.path}[*]` : child.path);
            if (depth < 14) walk(child, depth + 1);
        }
    };
    walk(root, 0);
    return out;
};

/** The schema node at a canonical path, expanding the tree along it (null when the spec has no such field). */
export const findSchemaNode = (spec: SpecJson, api: string, path: string): SchemaNode | null => {
    let node = getSchemaRoot(spec, api);
    if (!node || path === "$") return node;
    const steps = path
        .slice(2)
        .replace(/\[\*\]/g, "")
        .split(".")
        .filter(Boolean);
    for (const step of steps) {
        const next: SchemaNode | undefined = getSchemaChildren(spec, node).find(
            (child) => child.key === step
        );
        if (!next) return null;
        node = next;
    }
    return node;
};

/** component name → the apis whose request schema reaches it through `$ref`s. */
export const buildRefUsers = (spec: SpecJson): Map<string, Set<string>> => {
    const users = new Map<string, Set<string>>();
    const refsOf = (value: unknown, out: Set<string>) => {
        if (Array.isArray(value)) value.forEach((v) => refsOf(v, out));
        else if (value && typeof value === "object") {
            for (const [key, v] of Object.entries(value)) {
                if (key === "$ref" && typeof v === "string") out.add(v);
                else refsOf(v, out);
            }
        }
    };
    for (const api of getSpecApis(spec)) {
        const queue: unknown[] = [resolvePointer(spec, getRequestSchemaPointer(api))];
        const visited = new Set<string>();
        while (queue.length) {
            const refs = new Set<string>();
            refsOf(queue.shift(), refs);
            for (const ref of refs) {
                if (visited.has(ref)) continue;
                visited.add(ref);
                const name = componentName(ref);
                if (name) {
                    const set = users.get(name) ?? new Set<string>();
                    set.add(api);
                    users.set(name, set);
                }
                queue.push(resolvePointer(spec, ref));
            }
        }
    }
    return users;
};
