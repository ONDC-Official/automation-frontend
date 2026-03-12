import { FC, useState, useCallback, createContext, useContext, useMemo } from "react";
import { FiChevronRight, FiChevronDown } from "react-icons/fi";
import type { OpenAPISchema } from "../types";
import type { OpenAPISpecification } from "../types";
import { resolveSchema } from "./specUtils";

// ─── tree context (expand / collapse all) ─────────────────────────────────────

interface TreeCtx {
    generation: number;
    defaultOpen: boolean;
}
const TreeContext = createContext<TreeCtx>({ generation: 0, defaultOpen: true });

// ─── helpers ──────────────────────────────────────────────────────────────────

function getSchemaType(schema: OpenAPISchema): string {
    if (schema.type) return schema.type;
    if (schema.properties) return "object";
    if (schema.allOf) return "allOf";
    return "any";
}

function getTypeLabel(schema: OpenAPISchema, resolvedItems?: OpenAPISchema | null): string {
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

const TYPE_COLORS: Record<string, string> = {
    string: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    integer: "bg-sky-50 text-sky-700 ring-sky-200",
    number: "bg-sky-50 text-sky-700 ring-sky-200",
    boolean: "bg-amber-50 text-amber-700 ring-amber-200",
    object: "bg-slate-50 text-slate-600 ring-slate-200",
    array: "bg-violet-50 text-violet-700 ring-violet-200",
    allOf: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    any: "bg-slate-50 text-slate-500 ring-slate-200",
};

function typeColor(schema: OpenAPISchema): string {
    const t = getSchemaType(schema);
    return TYPE_COLORS[t] ?? TYPE_COLORS["any"];
}

// ─── truncated description ────────────────────────────────────────────────────

const DESC_CHAR_LIMIT = 120;

const TruncatedDescription: FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (text.length <= DESC_CHAR_LIMIT) {
        return <span>{text}</span>;
    }
    return (
        <span>
            {expanded ? text : `${text.slice(0, DESC_CHAR_LIMIT)}…`}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-1 text-[11px] text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
            >
                {expanded ? "less" : "more"}
            </button>
        </span>
    );
};

// ─── tree guide lines ─────────────────────────────────────────────────────────

const INDENT_PX = 18;

const TreeIndent: FC<{ depth: number }> = ({ depth }) => {
    if (depth === 0) return null;

    return (
        <span className="inline-flex items-center shrink-0" style={{ width: depth * INDENT_PX }}>
            {Array.from({ length: depth }).map((_, i) => (
                <span key={i} className="inline-block h-full shrink-0" style={{ width: INDENT_PX }}>
                    {i === depth - 1 ? (
                        <span className="inline-block w-3 border-l border-b border-sky-400 h-3 ml-1.5 -mb-0.5" />
                    ) : (
                        <span className="inline-block border-l border-sky-400 h-full ml-1.5" />
                    )}
                </span>
            ))}
        </span>
    );
};

// ─── single property row ──────────────────────────────────────────────────────

interface PropertyRowProps {
    name: string;
    schema: OpenAPISchema;
    spec: OpenAPISpecification;
    required: boolean;
    depth: number;
    showRequiredColumn: boolean;
    isLast: boolean;
}

const PropertyRow: FC<PropertyRowProps> = ({
    name,
    schema,
    spec,
    required,
    depth,
    showRequiredColumn,
    isLast: _isLast,
}) => {
    const ctx = useContext(TreeContext);
    const [localOpen, setLocalOpen] = useState<boolean | null>(null);

    const [lastGen, setLastGen] = useState(ctx.generation);
    if (ctx.generation !== lastGen) {
        setLastGen(ctx.generation);
        if (localOpen !== null) setLocalOpen(null);
    }

    const isOpen = localOpen ?? (depth === 0 ? true : ctx.defaultOpen);

    const resolved = resolveSchema(spec, schema, depth) ?? schema ?? null;

    // Pre-resolve array items so $ref-backed item schemas can be expanded
    const resolvedItems =
        resolved?.type === "array"
            ? (resolveSchema(spec, resolved.items as OpenAPISchema | undefined, depth + 1) ?? null)
            : null;

    if (!resolved) {
        return (
            <tr className="border-b border-sky-100/60">
                <td className="py-2 pr-3 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1 min-w-0">
                        <TreeIndent depth={depth} />
                        <span className="shrink-0 inline-block w-3.5" aria-hidden="true" />
                        <span className="font-mono text-xs font-semibold text-slate-700">
                            {name}
                        </span>
                    </div>
                </td>
                <td className="py-2 pr-3 align-top">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ring-1 bg-slate-50 text-slate-500 ring-slate-200">
                        any
                    </span>
                </td>
                {showRequiredColumn && (
                    <td className="py-2 pr-3 align-top">
                        {required ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
                                required
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400">optional</span>
                        )}
                    </td>
                )}
                <td className="py-2 align-top" />
            </tr>
        );
    }

    const hasChildren =
        !!resolved.properties || (resolved.type === "array" && !!resolvedItems?.properties);

    const childSchema: OpenAPISchema | null = (() => {
        if (resolved.properties) return resolved;
        if (resolved.type === "array" && resolvedItems?.properties) return resolvedItems;
        return null;
    })();

    const childRequired = Array.isArray(childSchema?.required)
        ? (childSchema!.required as string[])
        : [];

    const childEntries = childSchema?.properties
        ? Object.entries(childSchema.properties).filter(([, v]) => v != null)
        : [];

    // subtle alternating depth bands
    const rowBg = depth % 2 === 1 ? "bg-sky-50/30 hover:bg-sky-100/40" : "hover:bg-sky-50/40";

    return (
        <>
            <tr className={`group border-b border-sky-100/60 transition-colors ${rowBg}`}>
                {/* Property name */}
                <td className="py-2 pr-3 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1 min-w-0">
                        <TreeIndent depth={depth} />
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => setLocalOpen((v) => !(v ?? isOpen))}
                                className="shrink-0 text-sky-400 hover:text-sky-600 transition-colors"
                            >
                                {isOpen ? (
                                    <FiChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                    <FiChevronRight className="w-3.5 h-3.5" />
                                )}
                            </button>
                        ) : (
                            <span className="shrink-0 inline-block w-3.5" aria-hidden="true" />
                        )}
                        <span className="font-mono text-xs font-semibold text-slate-800">
                            {name}
                        </span>
                        {hasChildren && (
                            <span className="ml-1 text-[10px] text-sky-400 font-mono">
                                {`{${childEntries.length}}`}
                            </span>
                        )}
                    </div>
                </td>

                {/* Type */}
                <td className="py-2 pr-3 align-top whitespace-nowrap">
                    <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ring-1 ${typeColor(resolved)}`}
                    >
                        {getTypeLabel(resolved, resolvedItems)}
                    </span>
                </td>

                {/* Required */}
                {showRequiredColumn && (
                    <td className="py-2 pr-3 align-top whitespace-nowrap">
                        {required ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
                                required
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-400">optional</span>
                        )}
                    </td>
                )}

                {/* Description / enum */}
                <td className="py-2 align-top text-xs text-slate-500 leading-relaxed max-w-xs">
                    {resolved.description && <TruncatedDescription text={resolved.description} />}
                    {Array.isArray(resolved.enum) && (
                        <span className="block mt-0.5 text-[10px] text-slate-400">
                            enum:{" "}
                            {(resolved.enum as unknown[]).map((v) => (
                                <code
                                    key={String(v)}
                                    className="mx-0.5 px-1 py-px bg-sky-50 rounded font-mono text-sky-700 ring-1 ring-sky-200/60"
                                >
                                    {String(v)}
                                </code>
                            ))}
                        </span>
                    )}
                </td>
            </tr>

            {/* Nested children */}
            {hasChildren &&
                isOpen &&
                childEntries.map(([childName, childProp], idx) => (
                    <PropertyRow
                        key={`${name}.${childName}`}
                        name={childName}
                        schema={childProp as OpenAPISchema}
                        spec={spec}
                        required={childRequired.includes(childName)}
                        depth={depth + 1}
                        showRequiredColumn={showRequiredColumn}
                        isLast={idx === childEntries.length - 1}
                    />
                ))}
        </>
    );
};

// ─── property count helper ────────────────────────────────────────────────────

function countProperties(schema: OpenAPISchema, spec: OpenAPISpecification): number {
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

// ─── public component ─────────────────────────────────────────────────────────

interface SchemaTreeProps {
    schema: OpenAPISchema;
    spec: OpenAPISpecification;
    showRequiredColumn?: boolean;
}

const SchemaTree: FC<SchemaTreeProps> = ({ schema, spec, showRequiredColumn = true }) => {
    const resolved = resolveSchema(spec, schema) ?? schema;
    const topRequired = Array.isArray(resolved.required) ? (resolved.required as string[]) : [];

    const [generation, setGeneration] = useState(0);
    const [defaultOpen, setDefaultOpen] = useState(true);

    const totalProps = useMemo(() => countProperties(schema, spec), [schema, spec]);

    const expandAll = useCallback(() => {
        setDefaultOpen(true);
        setGeneration((g) => g + 1);
    }, []);

    const collapseAll = useCallback(() => {
        setDefaultOpen(false);
        setGeneration((g) => g + 1);
    }, []);

    const ctxValue = useMemo<TreeCtx>(
        () => ({ generation, defaultOpen }),
        [generation, defaultOpen]
    );

    if (!resolved.properties) {
        return (
            <p className="text-sm text-slate-500 py-6 text-center">
                Schema has no properties to display.
            </p>
        );
    }

    const entries = Object.entries(resolved.properties).filter(([, v]) => v != null);

    return (
        <TreeContext.Provider value={ctxValue}>
            <div className="rounded-lg border border-sky-200/80 bg-white overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-sky-100 bg-gradient-to-r from-sky-50/80 to-white">
                    <span className="text-[11px] text-slate-500 font-mono">
                        {entries.length} top-level{" "}
                        {entries.length === 1 ? "property" : "properties"}
                        {totalProps > entries.length && (
                            <span className="text-slate-400"> · {totalProps} total</span>
                        )}
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={expandAll}
                            className="px-2 py-0.5 text-[11px] text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200/60 transition-colors"
                        >
                            Expand all
                        </button>
                        <button
                            type="button"
                            onClick={collapseAll}
                            className="px-2 py-0.5 text-[11px] text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200/60 transition-colors"
                        >
                            Collapse all
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                    <table className="w-full text-sm border-collapse table-fixed">
                        <colgroup>
                            <col className="w-[40%]" />
                            <col className="w-[100px]" />
                            {showRequiredColumn && <col className="w-[80px]" />}
                            <col />
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                            <tr className="border-b-2 border-sky-200/80">
                                <th className="py-2 px-3 text-left text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
                                    Property
                                </th>
                                <th className="py-2 pr-3 text-left text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
                                    Type
                                </th>
                                {showRequiredColumn && (
                                    <th className="py-2 pr-3 text-left text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
                                        Required
                                    </th>
                                )}
                                <th className="py-2 pr-3 text-left text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(([propName, propSchema], idx) => (
                                <PropertyRow
                                    key={propName}
                                    name={propName}
                                    schema={propSchema as OpenAPISchema}
                                    spec={spec}
                                    required={topRequired.includes(propName)}
                                    depth={0}
                                    showRequiredColumn={showRequiredColumn}
                                    isLast={idx === entries.length - 1}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TreeContext.Provider>
    );
};

export default SchemaTree;
