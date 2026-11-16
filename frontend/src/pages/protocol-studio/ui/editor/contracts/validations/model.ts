import { isAlias, isMap, isScalar, isSeq, type Node, type Pair, type YAMLMap } from "yaml";

import { pairKey, type Locator } from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import { lineOf, type ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import { contentEnd } from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import { anchorCensus } from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import {
    describeGuard,
    describeRule,
    jvalVariables,
    tryParseJval,
    type GuardSummary,
    type JvalExpr,
    type JvalOperand,
    type SentencePart,
} from "@pages/protocol-studio/ui/editor/contracts/validations/jval";
import {
    canonicalPath,
    isExternalPath,
    mergeScope,
} from "@pages/protocol-studio/ui/editor/contracts/validations/paths";

/** Keys of a test that are the DSL's own (the compiler's `TestObjectSyntax`); every other key is a variable. */
export const RESERVED = new Set([
    "_NAME_",
    "_DESCRIPTION_",
    "_RETURN_",
    "_SCOPE_",
    "_CONTINUE_",
    "_ERROR_CODE_",
    "_SUCCESS_CODE_",
]);

/** `_TESTS_` key for an api; `on_search1` falls back to `on_search` (the developer guide's rule). */
export const getTestKey = <T>(tests: Record<string, T>, api: string) => {
    if (api in tests) return api;
    const bare = api.replace(/\d+$/, "") || api;
    return bare in tests ? bare : undefined;
};

export interface VVar {
    name: string;
    kind: "path" | "list" | "scalar" | "other";
    value: unknown;
    /** For paths: as written, then resolved against the scope, then canonical. */
    path?: string;
    absolute?: string;
    canonical?: string;
    external?: boolean;
    /** The value is `*name` (a shared list): editing it edits every use. */
    alias?: string;
    at: Locator;
}

export interface VTest {
    /** `${api}/${indexPath}`: names repeat, ids don't. */
    id: string;
    api: string;
    indexPath: number[];
    kind: "rule" | "group";
    name?: string;
    description?: string;
    scope?: string;
    /** Scope in force, the parent's merged in. */
    effectiveScope?: string;
    continueExpr?: string;
    returnExpr?: string;
    errorCode?: unknown;
    successCode?: unknown;
    vars: VVar[];
    /** The parent group's variables, copied in by the compiler (the parent's value wins). */
    inherited: VVar[];
    /** Own variables a parent's variable overrides (the compiler drops the child's value). */
    shadowed: string[];
    returnAst?: JvalExpr;
    returnError?: { error: string; at: number };
    continueAst?: JvalExpr;
    continueError?: { error: string; at: number };
    sentence?: SentencePart[];
    guard?: GuardSummary;
    /** Canonical payload paths `_RETURN_` checks / that only `_CONTINUE_` reads. */
    checks: string[];
    guards: string[];
    /** Variables an expression names that the test doesn't declare (nor inherit). */
    unknownVars: string[];
    /** This test is reused: `- *name` here, or `&name` defined here and aliased elsewhere. */
    shared?: { anchor: string; uses: number; isAlias: boolean };
    at: Locator;
    /** 1-based lines in the file (for an alias: where the alias is written). */
    line: number;
    endLine: number;
    children?: VTest[];
}

export interface VDefinition {
    /** `enums` / `tags` / … */
    group: string;
    name: string;
    anchor?: string;
    values: string[];
    /** Aliases of the list's anchor. */
    uses: number;
    /** Aliases of anchors on single values (`- &LOAN LOAN` … `- *LOAN`). */
    valueUses: number;
    at: Locator;
    line: number;
}

export interface ValidationsModel {
    /** `_TESTS_` apis in file order. */
    apis: string[];
    tests: Map<string, VTest[]>;
    byId: Map<string, VTest>;
    /** Where each api's block sits (1-based lines, inclusive). */
    apiLines: Map<string, { line: number; endLine: number }>;
    definitions: VDefinition[];
    sessionDataLine?: number;
    testsLine?: number;
    counts: { rules: number; groups: number };
}

const scalarText = (value: unknown) =>
    value === null || value === undefined
        ? ""
        : typeof value === "string"
          ? value
          : JSON.stringify(value);

const getPair = (map: YAMLMap, key: string) =>
    map.items.find((pair) => isScalar(pair.key) && pair.key.value === key) as Pair | undefined;

const resolve = (parsed: ParsedContract, node: Node | null | undefined): Node | null => {
    let current = node ?? null;
    for (let guard = 0; current && isAlias(current) && guard < 50; guard++) {
        current = (current.resolve(parsed.doc) as Node | undefined) ?? null;
    }
    return current;
};

const toVar = (
    parsed: ParsedContract,
    name: string,
    raw: Node | null,
    at: Locator,
    scope: string | undefined
): VVar => {
    const node = resolve(parsed, raw);
    const alias = raw && isAlias(raw) ? raw.source : undefined;
    if (node && isSeq(node)) {
        const values = node.items.map((item) => {
            const value = resolve(parsed, item as Node);
            return value && isScalar(value) ? scalarText(value.value) : "…";
        });
        return { name, kind: "list", value: values, alias, at };
    }
    if (node && isScalar(node)) {
        const value = node.value;
        if (typeof value === "string" && value.startsWith("$")) {
            const absolute = mergeScope(value, scope);
            return {
                name,
                kind: "path",
                value,
                path: value,
                absolute,
                canonical: canonicalPath(absolute)?.path,
                external: isExternalPath(absolute),
                alias,
                at,
            };
        }
        return { name, kind: "scalar", value, alias, at };
    }
    return {
        name,
        kind: "other",
        value: node ? (node as { toJSON?: () => unknown }).toJSON?.() : null,
        alias,
        at,
    };
};

const operandOf = (v: VVar): JvalOperand => {
    if (v.kind === "path") return { name: v.name, kind: "path", path: v.absolute ?? v.path };
    if (v.kind === "list") return { name: v.name, kind: "list", values: v.value as string[] };
    if (v.kind === "scalar") return { name: v.name, kind: "scalar", value: scalarText(v.value) };
    return { name: v.name, kind: "unknown" };
};

/**
 * The validations file as tests: per api, a tree of groups and rules, each
 * with its variables, scope, readable sentence and the payload paths it
 * checks. Built from the parse; nothing here edits.
 */
export const buildValidationsModel = (parsed: ParsedContract): ValidationsModel => {
    const root = parsed.doc.contents as Node | null;
    const model: ValidationsModel = {
        apis: [],
        tests: new Map(),
        byId: new Map(),
        apiLines: new Map(),
        definitions: [],
        counts: { rules: 0, groups: 0 },
    };
    if (!root || !isMap(root)) return model;
    const usesByNode = new Map(anchorCensus(parsed).map((info) => [info.node, info.uses.length]));
    const usesOf = (node: Node) => usesByNode.get(node) ?? 0;

    const buildTest = (
        raw: Node,
        api: string,
        indexPath: number[],
        at: Locator,
        parentVars: VVar[],
        parentScope: string | undefined
    ): VTest | null => {
        const node = resolve(parsed, raw);
        if (!node || !isMap(node)) return null;
        const get = (key: string) => (getPair(node, key)?.value as Node | null | undefined) ?? null;
        const text = (key: string) => {
            const value = resolve(parsed, get(key));
            return value && isScalar(value) ? scalarText(value.value) : undefined;
        };
        const scope = text("_SCOPE_");
        const effectiveScope = scope ? mergeScope(scope, parentScope) : parentScope;
        const vars: VVar[] = [];
        for (const pair of node.items) {
            const key = pairKey(pair);
            if (RESERVED.has(key)) continue;
            vars.push(toVar(parsed, key, pair.value as Node | null, [...at, key], effectiveScope));
        }
        const ownNames = new Set(vars.map((v) => v.name));
        const shadowed = parentVars.filter((v) => ownNames.has(v.name)).map((v) => v.name);
        // The compiler copies the parent's variables in, and the parent's value wins.
        const effective = new Map<string, VVar>();
        for (const v of vars) effective.set(v.name, v);
        for (const v of parentVars) effective.set(v.name, v);
        const lookup = (name: string) => {
            const v = effective.get(name);
            return v ? operandOf(v) : undefined;
        };

        const returnNode = resolve(parsed, get("_RETURN_"));
        const isGroup = !!returnNode && isSeq(returnNode);
        const returnExpr = !isGroup ? text("_RETURN_") : undefined;
        const continueExpr = text("_CONTINUE_");
        const test: VTest = {
            id: `${api}/${indexPath.join(".")}`,
            api,
            indexPath,
            kind: isGroup ? "group" : "rule",
            name: text("_NAME_"),
            description: text("_DESCRIPTION_"),
            scope,
            effectiveScope,
            continueExpr,
            returnExpr,
            errorCode: getPair(node, "_ERROR_CODE_")
                ? resolve(parsed, get("_ERROR_CODE_"))?.toJSON()
                : undefined,
            successCode: getPair(node, "_SUCCESS_CODE_")
                ? resolve(parsed, get("_SUCCESS_CODE_"))?.toJSON()
                : undefined,
            vars,
            inherited: parentVars,
            shadowed,
            checks: [],
            guards: [],
            unknownVars: [],
            at,
            line: lineOf(parsed, raw.range?.[0] ?? 0),
            endLine: lineOf(parsed, Math.max(0, (raw.range ? contentEnd(raw) : 1) - 1)),
        };

        const used = new Set<string>();
        if (returnExpr !== undefined) {
            const result = tryParseJval(returnExpr);
            if ("ast" in result) {
                test.returnAst = result.ast;
                test.sentence = describeRule(result.ast, lookup);
                for (const name of jvalVariables(result.ast)) used.add(name);
            } else test.returnError = result;
        }
        const guardNames = new Set<string>();
        if (continueExpr !== undefined) {
            const result = tryParseJval(continueExpr);
            if ("ast" in result) {
                test.continueAst = result.ast;
                test.guard = describeGuard(result.ast, lookup);
                for (const name of jvalVariables(result.ast)) guardNames.add(name);
            } else test.continueError = result;
        }
        const pathOf = (name: string) => {
            const v = effective.get(name);
            return v?.kind === "path" && !v.external ? v.canonical : undefined;
        };
        for (const name of used) {
            const path = pathOf(name);
            if (path && !test.checks.includes(path)) test.checks.push(path);
        }
        for (const name of guardNames) {
            const path = pathOf(name);
            if (path && !test.checks.includes(path) && !test.guards.includes(path))
                test.guards.push(path);
        }
        test.unknownVars = [...new Set([...used, ...guardNames])].filter(
            (name) => !effective.has(name)
        );

        if (raw && isAlias(raw)) {
            test.shared = { anchor: raw.source, uses: usesOf(node) + 1, isAlias: true };
        } else if (node.anchor && usesOf(node) > 0) {
            test.shared = { anchor: node.anchor, uses: usesOf(node) + 1, isAlias: false };
        } else {
            const holder = getPair(node, "_RETURN_")?.value as Node | null | undefined;
            if (holder && isAlias(holder)) {
                test.shared = {
                    anchor: holder.source,
                    uses: usesOf(resolve(parsed, holder) as Node) + 1,
                    isAlias: true,
                };
            } else if (holder && !isAlias(holder) && holder.anchor && usesOf(holder) > 0) {
                test.shared = { anchor: holder.anchor, uses: usesOf(holder) + 1, isAlias: false };
            }
        }

        if (isGroup && returnNode && isSeq(returnNode)) {
            const passDown = [
                ...parentVars,
                ...vars.filter((v) => !parentVars.some((p) => p.name === v.name)),
            ];
            test.children = [];
            returnNode.items.forEach((item, index) => {
                const child = buildTest(
                    item as Node,
                    api,
                    [...indexPath, index],
                    [...at, "_RETURN_", index],
                    passDown,
                    effectiveScope
                );
                if (child) {
                    test.children!.push(child);
                    for (const path of child.checks)
                        if (!test.checks.includes(path)) test.checks.push(path);
                }
            });
            model.counts.groups++;
        } else {
            model.counts.rules++;
        }
        model.byId.set(test.id, test);
        return test;
    };

    for (const pair of root.items) {
        const key = pairKey(pair);
        const value = pair.value as Node | null;
        const line = lineOf(parsed, (pair.key as Node | null)?.range?.[0] ?? 0);
        if (key === "_TESTS_") {
            model.testsLine = line;
            const tests = resolve(parsed, value);
            if (!tests || !isMap(tests)) continue;
            for (const apiPair of tests.items) {
                const api = pairKey(apiPair);
                const list = resolve(parsed, apiPair.value as Node | null);
                model.apis.push(api);
                const keyNode = apiPair.key as Node;
                const valueNode = apiPair.value as Node | null;
                model.apiLines.set(api, {
                    line: lineOf(parsed, keyNode.range?.[0] ?? 0),
                    endLine: lineOf(
                        parsed,
                        Math.max(
                            0,
                            (valueNode?.range ? contentEnd(valueNode) : (keyNode.range?.[1] ?? 1)) -
                                1
                        )
                    ),
                });
                const built: VTest[] = [];
                if (list && isSeq(list)) {
                    list.items.forEach((item, index) => {
                        const test = buildTest(
                            item as Node,
                            api,
                            [index],
                            ["_TESTS_", api, index],
                            [],
                            undefined
                        );
                        if (test) built.push(test);
                    });
                }
                model.tests.set(api, built);
            }
        } else if (key === "_SESSION_DATA_") {
            model.sessionDataLine = line;
        } else {
            const group = resolve(parsed, value);
            if (!group || !isMap(group)) continue;
            for (const entry of group.items) {
                const name = pairKey(entry);
                const raw = entry.value as Node | null;
                const list = resolve(parsed, raw);
                const values =
                    list && isSeq(list)
                        ? list.items.map((item) => {
                              const v = resolve(parsed, item as Node);
                              return v && isScalar(v) ? scalarText(v.value) : "…";
                          })
                        : list && isScalar(list)
                          ? [scalarText(list.value)]
                          : [];
                let valueUses = 0;
                if (list && isSeq(list)) {
                    for (const item of list.items) {
                        if (item && !isAlias(item) && (item as Node).anchor)
                            valueUses += usesOf(item as Node);
                    }
                }
                model.definitions.push({
                    group: key,
                    name,
                    anchor: raw && !isAlias(raw) ? raw.anchor : undefined,
                    values,
                    uses: list && !isAlias(raw as Node) ? usesOf(list) : 0,
                    valueUses,
                    at: [key, name],
                    line: lineOf(parsed, (entry.key as Node | null)?.range?.[0] ?? 0),
                });
            }
        }
    }
    return model;
};

/** Every test of an api, depth first (groups before their children). */
export const flattenTests = (tests: VTest[]): VTest[] =>
    tests.flatMap((test) => [test, ...flattenTests(test.children ?? [])]);
