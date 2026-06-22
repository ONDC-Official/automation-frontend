import type { OpenAPISchema, OpenAPISpecification } from "../../types";
import { resolveSchema } from "../specUtils";
import { TYPE_COLORS } from "./constants";

export interface SchemaRow {
    /** Dotted path, unique within the tree — used as React key and expand-override key. */
    key: string;
    name: string;
    resolved: OpenAPISchema;
    resolvedItems: OpenAPISchema | null;
    depth: number;
    required: boolean;
    hasChildren: boolean;
    childCount: number;
    isExpanded: boolean;
}

export function getSchemaType(schema: OpenAPISchema): string {
    if (schema.type) return schema.type;
    if (schema.properties) return "object";
    if (schema.allOf) return "allOf";
    return "any";
}

export function getTypeLabel(schema: OpenAPISchema, resolvedItems?: OpenAPISchema | null): string {
    const t = getSchemaType(schema);
    if (t === "array") {
        if (resolvedItems?.type && resolvedItems.type !== "object")
            return `${resolvedItems.type}[]`;
        if (resolvedItems?.properties) return "object[]";
        const items = schema.items as OpenAPISchema | undefined;
        if (items?.type) return `${items.type}[]`;
        if (items?.["$ref"]) {
            const refName = String(items["$ref"]).split("/").pop();
            return `${refName}[]`;
        }
        return "array";
    }
    return t;
}

export function typeColor(schema: OpenAPISchema): string {
    const t = getSchemaType(schema);
    return TYPE_COLORS[t] ?? TYPE_COLORS["any"];
}

export function countProperties(schema: OpenAPISchema, spec: OpenAPISpecification): number {
    const resolved = resolveSchema(spec, schema) ?? schema;
    if (!resolved?.properties) return 0;

    let count = 0;
    const recurse = (s: OpenAPISchema) => {
        const r = resolveSchema(spec, s) ?? s;
        if (!r?.properties) return;
        for (const val of Object.values(r.properties)) {
            if (val == null) continue;
            count++;
            const rv = resolveSchema(spec, val as OpenAPISchema) ?? (val as OpenAPISchema);
            if (rv?.properties) recurse(rv);
            if (rv?.type === "array") {
                const items = rv.items as OpenAPISchema | undefined;
                if (items?.properties) {
                    const ri = resolveSchema(spec, items) ?? items;
                    if (ri) recurse(ri);
                }
            }
        }
    };
    recurse(resolved);
    return count;
}

/**
 * Flattens a (potentially deeply nested) schema into an ordered list of visible
 * rows, expanding a node's children only when `isExpanded(row.key)` is true.
 * This lets the tree be paged with a generic flat-row table (`GuideTable`)
 * instead of rendering nested JSX recursively.
 */
export function flattenSchema(
    schema: OpenAPISchema,
    spec: OpenAPISpecification,
    isExpanded: (key: string) => boolean
): SchemaRow[] {
    const rows: SchemaRow[] = [];

    const visit = (
        name: string,
        rawSchema: OpenAPISchema,
        required: boolean,
        depth: number,
        path: string
    ) => {
        const resolved = resolveSchema(spec, rawSchema, depth) ?? rawSchema;
        if (!resolved) return;

        const resolvedItems =
            resolved.type === "array"
                ? (resolveSchema(spec, resolved.items as OpenAPISchema | undefined, depth + 1) ??
                  null)
                : null;

        const childSchema: OpenAPISchema | null = resolved.properties
            ? resolved
            : resolved.type === "array" && resolvedItems?.properties
              ? resolvedItems
              : null;

        const childEntries = childSchema?.properties
            ? Object.entries(childSchema.properties).filter(([, v]) => v != null)
            : [];

        const hasChildren = childEntries.length > 0;
        const expanded = hasChildren && isExpanded(path);

        rows.push({
            key: path,
            name,
            resolved,
            resolvedItems,
            depth,
            required,
            hasChildren,
            childCount: childEntries.length,
            isExpanded: expanded,
        });

        if (!expanded) return;

        const childRequired = Array.isArray(childSchema?.required)
            ? (childSchema!.required as string[])
            : [];

        for (const [childName, childProp] of childEntries) {
            visit(
                childName,
                childProp as OpenAPISchema,
                childRequired.includes(childName),
                depth + 1,
                `${path}.${childName}`
            );
        }
    };

    const resolved = resolveSchema(spec, schema) ?? schema;
    const topRequired = Array.isArray(resolved?.required) ? (resolved!.required as string[]) : [];
    const topEntries = resolved?.properties
        ? Object.entries(resolved.properties).filter(([, v]) => v != null)
        : [];

    for (const [name, propSchema] of topEntries) {
        visit(name, propSchema as OpenAPISchema, topRequired.includes(name), 0, name);
    }

    return rows;
}
