import { isMap, isScalar, isSeq, type Node } from "yaml";

import { pairKey, type Locator } from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import { lineOf, type ParsedContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import type { ContractEdit } from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";

/** The `supportedActions` key for "no call yet": the apis a transaction may start with. */
export const ENTRY_KEY = "null";

export interface ApiProperties {
    asyncPredecessor: string | null;
    partners: string[];
    line: number;
}

export interface ActionsModel {
    /** Apis a transaction may start with (`"null"`), or null when the file has no entry row. */
    entry: string[] | null;
    /** api → apis allowed next, in file order. */
    next: Map<string, string[]>;
    /** api → apis it may follow (reverse of `next`, entry excluded). */
    prev: Map<string, string[]>;
    props: Map<string, ApiProperties>;
    /** Every api the file names (keys, targets, properties), file order first. */
    apis: string[];
    /** 1-based line of each api's `supportedActions` row. */
    lines: Map<string, number>;
    hasSupportedActions: boolean;
    hasApiProperties: boolean;
}

const strings = (node: Node | null | undefined): string[] =>
    node && isSeq(node)
        ? node.items.flatMap((item) =>
              isScalar(item) && item.value !== null ? [String(item.value)] : []
          )
        : [];

export const buildActionsModel = (parsed: ParsedContract): ActionsModel => {
    const model: ActionsModel = {
        entry: null,
        next: new Map(),
        prev: new Map(),
        props: new Map(),
        apis: [],
        lines: new Map(),
        hasSupportedActions: false,
        hasApiProperties: false,
    };
    const root = parsed.doc.contents as Node | null;
    if (!root || !isMap(root)) return model;
    const seen = new Set<string>();
    const add = (api: string) => {
        if (!seen.has(api)) {
            seen.add(api);
            model.apis.push(api);
        }
    };
    for (const pair of root.items) {
        const key = pairKey(pair);
        const value = pair.value as Node | null;
        if (key === "supportedActions" && value && isMap(value)) {
            model.hasSupportedActions = true;
            for (const row of value.items) {
                const from = pairKey(row);
                const targets = strings(row.value as Node | null);
                const line = lineOf(parsed, (row.key as Node | null)?.range?.[0] ?? 0);
                if (from === ENTRY_KEY || from === "") {
                    model.entry = targets;
                    model.lines.set(ENTRY_KEY, line);
                } else {
                    add(from);
                    model.next.set(from, targets);
                    model.lines.set(from, line);
                }
                for (const to of targets) {
                    add(to);
                    if (from !== ENTRY_KEY && from !== "") {
                        model.prev.set(to, [...(model.prev.get(to) ?? []), from]);
                    }
                }
            }
        } else if (key === "apiProperties" && value && isMap(value)) {
            model.hasApiProperties = true;
            for (const row of value.items) {
                const api = pairKey(row);
                add(api);
                const props = row.value as Node | null;
                let asyncPredecessor: string | null = null;
                let partners: string[] = [];
                if (props && isMap(props)) {
                    for (const prop of props.items) {
                        const name = pairKey(prop);
                        const v = prop.value as Node | null;
                        if (name === "async_predecessor" && v && isScalar(v) && v.value !== null) {
                            asyncPredecessor = String(v.value);
                        } else if (name === "transaction_partner") {
                            partners = strings(v);
                        }
                    }
                }
                model.props.set(api, {
                    asyncPredecessor,
                    partners,
                    line: lineOf(parsed, (row.key as Node | null)?.range?.[0] ?? 0),
                });
            }
        }
    }
    return model;
};

// ─── Edits ───────────────────────────────────────────────────────────────────

const rowAt = (from: string): Locator => ["supportedActions", from];

/** Allow (or stop allowing) `to` right after `from` (`from` = ENTRY_KEY: as a first call). */
export const toggleNext = (model: ActionsModel, from: string, to: string): ContractEdit[] => {
    const current = from === ENTRY_KEY ? model.entry : (model.next.get(from) ?? null);
    if (!model.hasSupportedActions) {
        return [{ op: "setPair", at: [], key: "supportedActions", value: { [from]: [to] } }];
    }
    if (current === null) {
        return [{ op: "setPair", at: ["supportedActions"], key: from, value: [to] }];
    }
    const items = current.includes(to) ? current.filter((api) => api !== to) : [...current, to];
    return [{ op: "setSeqItems", at: rowAt(from), items }];
};

/** Adds an api's (empty) row to supportedActions. */
export const addApiRow = (model: ActionsModel, api: string): ContractEdit[] =>
    model.hasSupportedActions
        ? [{ op: "setPair", at: ["supportedActions"], key: api, value: [] }]
        : [{ op: "setPair", at: [], key: "supportedActions", value: { [api]: [] } }];

const propsEdit = (
    model: ActionsModel,
    api: string,
    key: string,
    value: unknown
): ContractEdit[] => {
    if (!model.hasApiProperties) {
        return [
            {
                op: "setPair",
                at: [],
                key: "apiProperties",
                value: {
                    [api]: { async_predecessor: null, transaction_partner: [], [key]: value },
                },
            },
        ];
    }
    if (!model.props.has(api)) {
        return [
            {
                op: "setPair",
                at: ["apiProperties"],
                key: api,
                value: { async_predecessor: null, transaction_partner: [], [key]: value },
            },
        ];
    }
    return [{ op: "setPair", at: ["apiProperties", api], key, value }];
};

export const setAsyncPredecessor = (model: ActionsModel, api: string, predecessor: string | null) =>
    propsEdit(model, api, "async_predecessor", predecessor);

export const togglePartner = (
    model: ActionsModel,
    api: string,
    partner: string
): ContractEdit[] => {
    const current = model.props.get(api)?.partners ?? [];
    const items = current.includes(partner)
        ? current.filter((p) => p !== partner)
        : [...current, partner];
    if (model.props.has(api))
        return [{ op: "setSeqItems", at: ["apiProperties", api, "transaction_partner"], items }];
    return propsEdit(model, api, "transaction_partner", items);
};
