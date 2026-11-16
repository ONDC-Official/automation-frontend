import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRightIcon, FlagIcon } from "@heroicons/react/24/outline";

import {
    getSchemaChildren,
    type SchemaNode,
    type SpecJson,
} from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import type { ApiTestIndex } from "@pages/protocol-studio/ui/editor/contracts/validations/test-index";
import { pathPrefixes } from "@pages/protocol-studio/ui/editor/contracts/validations/paths";

interface ISchemaTreeProps {
    spec: SpecJson;
    root: SchemaNode;
    /** Tests on this api, by path: rows get a ⚑ count. */
    index?: ApiTestIndex;
    /** A path to open the tree at, scroll to and mark. */
    focusPath?: string;
    focusNonce?: number;
    onTests?: (path: string) => void;
    onRef?: (component: string) => void;
    filter?: string;
}

const MAX_ENUM = 5;

interface Row {
    node: SchemaNode;
    depth: number;
}

/**
 * A request schema as an outline: one row per field, `allOf` merged, arrays
 * shown as `[]`, `$ref`s named. Opens lazily; each field says how many tests
 * check it (and how many check something under it).
 */
export const SchemaTree = ({
    spec,
    root,
    index,
    focusPath,
    focusNonce,
    onTests,
    onRef,
    filter,
}: ISchemaTreeProps) => {
    const [open, setOpen] = useState<Set<string>>(() => new Set(["$", "$.context", "$.message"]));
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (!focusPath) return;
        setOpen((prev) => {
            const next = new Set(prev);
            for (const prefix of pathPrefixes(focusPath)) next.add(prefix.replace(/\[\*\]$/, ""));
            return next;
        });
        const id = window.setTimeout(() => {
            listRef.current
                ?.querySelector(
                    `[data-schema-path="${CSS.escape(focusPath.replace(/\[\*\]$/, ""))}"]`
                )
                ?.scrollIntoView({ block: "center" });
        }, 30);
        return () => window.clearTimeout(id);
    }, [focusPath, focusNonce]);

    const rows = useMemo(() => {
        const needle = filter?.trim().toLowerCase();
        let budget = 3000;
        // Filtering shows the matching fields with their ancestors, all open.
        const walk = (node: SchemaNode, depth: number): Row[] => {
            const out: Row[] = [];
            for (const child of getSchemaChildren(spec, node)) {
                if (--budget < 0) break;
                if (needle) {
                    const inside = depth < 10 && child.hasChildren ? walk(child, depth + 1) : [];
                    if (child.path.toLowerCase().includes(needle) || inside.length) {
                        out.push({ node: child, depth }, ...inside);
                    }
                } else {
                    out.push({ node: child, depth });
                    if (child.hasChildren && open.has(child.path))
                        out.push(...walk(child, depth + 1));
                }
            }
            return out;
        };
        return walk(root, 0);
    }, [spec, root, open, filter]);

    const toggle = (path: string) =>
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });

    if (rows.length === 0) {
        return (
            <p className="studio-spec-empty">
                {filter ? "No field matches." : "This schema has no fields."}
            </p>
        );
    }

    return (
        <ul
            ref={listRef}
            className="studio-spec-schema"
            role="tree"
            aria-label={`${root.key} request schema`}
        >
            {rows.map(({ node, depth }) => {
                const key = node.isArray ? `${node.path}[*]` : node.path;
                const tests = index?.byPath.get(node.path)?.checks.length ?? 0;
                const itemTests = node.isArray ? (index?.byPath.get(key)?.checks.length ?? 0) : 0;
                const own = tests + itemTests;
                const below = index?.below.get(node.path) ?? 0;
                const guards = index?.byPath.get(node.path)?.guards.length ?? 0;
                const isOpen = open.has(node.path) || !!filter;
                const enumShown = node.enum?.slice(0, MAX_ENUM) ?? [];
                return (
                    <li
                        key={node.path}
                        role="treeitem"
                        aria-expanded={node.hasChildren ? isOpen : undefined}
                        className="studio-spec-schema-row"
                        data-schema-path={node.path}
                        data-test-count={own || undefined}
                        data-focused={
                            focusPath && focusPath.replace(/\[\*\]$/, "") === node.path
                                ? true
                                : undefined
                        }
                        style={{ "--depth": depth } as React.CSSProperties}
                    >
                        <button
                            type="button"
                            className="studio-spec-twisty"
                            data-open={isOpen || undefined}
                            disabled={!node.hasChildren}
                            onClick={() => toggle(node.path)}
                            aria-label={isOpen ? `Collapse ${node.key}` : `Expand ${node.key}`}
                        >
                            {node.hasChildren ? <ChevronRightIcon /> : null}
                        </button>
                        <span className="studio-mono studio-spec-key" title={node.path}>
                            {node.key}
                            {node.isArray ? <span className="studio-text-faint">[]</span> : null}
                        </span>
                        {node.required ? (
                            <span className="studio-spec-req" title="Required">
                                req
                            </span>
                        ) : null}
                        {node.refName && onRef ? (
                            <button
                                type="button"
                                className="studio-spec-type studio-spec-ref"
                                title={`#/components/schemas/${node.refName}`}
                                onClick={() => onRef(node.refName!)}
                            >
                                {node.type}
                            </button>
                        ) : (
                            <span
                                className="studio-spec-type"
                                title={node.format ? `format: ${node.format}` : undefined}
                            >
                                {node.type}
                            </span>
                        )}
                        {node.cyclic ? (
                            <span
                                className="studio-badge"
                                title="Refers back to a schema it's inside"
                            >
                                ↻
                            </span>
                        ) : null}
                        {node.partial ? (
                            <span
                                className="studio-badge"
                                title="Some fields come from oneOf / anyOf branches"
                            >
                                one of
                            </span>
                        ) : null}
                        {enumShown.length ? (
                            <span className="studio-spec-enum" title={node.enum!.join(", ")}>
                                {enumShown.map((v) => (
                                    <code key={String(v)}>{String(v)}</code>
                                ))}
                                {node.enum!.length > MAX_ENUM ? (
                                    <span>+{node.enum!.length - MAX_ENUM}</span>
                                ) : null}
                            </span>
                        ) : null}
                        <span className="min-w-0 flex-1" />
                        {node.description ? (
                            <span className="studio-spec-desc" title={node.description}>
                                {node.description}
                            </span>
                        ) : null}
                        {own > 0 || (below > 0 && !isOpen) || guards > 0 ? (
                            <button
                                type="button"
                                className="studio-spec-flag"
                                data-own={own > 0 || undefined}
                                onClick={() => onTests?.(node.path)}
                                title={
                                    own > 0
                                        ? `${own} ${own === 1 ? "test checks" : "tests check"} this field${guards ? ` · ${guards} use it to decide whether they apply` : ""}`
                                        : below > 0
                                          ? `${below} ${below === 1 ? "test checks" : "tests check"} fields inside`
                                          : `${guards} ${guards === 1 ? "test uses" : "tests use"} it to decide whether they apply`
                                }
                            >
                                <FlagIcon />
                                {own > 0
                                    ? own
                                    : below > 0 && !isOpen
                                      ? `${below} inside`
                                      : `${guards} guard`}
                            </button>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
};

export default SchemaTree;
