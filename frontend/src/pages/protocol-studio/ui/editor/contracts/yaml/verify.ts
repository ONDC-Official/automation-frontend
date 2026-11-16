import {
    isAlias,
    isMap,
    isScalar,
    isSeq,
    type Document,
    type Node,
    type Pair,
    type YAMLSeq,
} from "yaml";

import {
    findPair,
    resolveLocator,
    resolveTarget,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/locate";
import {
    parseContract,
    toPlain,
    type ParsedContract,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import { applyPatches } from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";
import {
    EditBlockedError,
    lcsPairs,
    planEdit,
    type ContractEdit,
    type PlannedEdit,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import type { ScalarValue } from "@pages/protocol-studio/ui/editor/contracts/yaml/render";

const stripAnchorsDeep = (node: Node | null | undefined) => {
    if (!node || isAlias(node)) return;
    node.anchor = undefined;
    if (isSeq(node)) node.items.forEach((item) => stripAnchorsDeep(item as Node));
    else if (isMap(node)) for (const pair of node.items) stripAnchorsDeep(pair.value as Node);
};

const seqAt = (doc: Document, at: (string | number)[]): YAMLSeq => {
    const node = resolveTarget(doc, at)?.node;
    if (!node || !isSeq(node)) throw new Error("not a list");
    return node;
};

/**
 * What the edit means, applied to a copy of the parsed document rather than
 * its text: the yardstick the text patches are checked against.
 */
const applyToAst = (doc: Document, edit: ContractEdit) => {
    switch (edit.op) {
        case "setScalar": {
            const target = resolveTarget(doc, edit.at);
            if (target?.node && isScalar(target.node)) {
                target.node.value = edit.value;
                return;
            }
            const map = resolveTarget(doc, edit.at.slice(0, -1))?.node;
            const key = String(edit.at[edit.at.length - 1]);
            if (!map || !isMap(map)) throw new Error("not a mapping");
            const pair = findPair(map, key);
            if (pair) pair.value = doc.createNode(edit.value);
            else map.add(doc.createPair(key, edit.value));
            return;
        }
        case "setSeqItems": {
            const target = resolveTarget(doc, edit.at)?.node;
            if (!target || isScalar(target)) {
                const map = resolveTarget(doc, edit.at.slice(0, -1))?.node;
                if (!map || !isMap(map)) throw new Error("not a mapping");
                const key = String(edit.at[edit.at.length - 1]);
                const pair = findPair(map, key);
                if (pair) pair.value = doc.createNode(edit.items);
                else map.add(doc.createPair(key, edit.items));
                return;
            }
            const seq = seqAt(doc, edit.at);
            const before = seq.items.map((item) =>
                isScalar(item) ? (item.value as ScalarValue) : null
            );
            const kept = new Map(lcsPairs(before, edit.items).map(([i, j]) => [j, i]));
            seq.items = edit.items.map((value, j) => {
                const from = kept.get(j);
                return from !== undefined ? (seq.items[from] as Node) : doc.createNode(value);
            });
            return;
        }
        case "insertSeqItem":
            seqAt(doc, edit.at).items.splice(edit.index, 0, doc.createNode(edit.value));
            return;
        case "removeSeqItem":
            seqAt(doc, edit.at).items.splice(edit.index, 1);
            return;
        case "moveSeqItem": {
            const seq = seqAt(doc, edit.at);
            const [moved] = seq.items.splice(edit.from, 1);
            seq.items.splice(edit.to, 0, moved);
            return;
        }
        case "duplicateSeqItem": {
            const seq = seqAt(doc, edit.at);
            const copy = (seq.items[edit.index] as Node).clone() as Node;
            stripAnchorsDeep(copy);
            seq.items.splice(edit.index + 1, 0, copy);
            return;
        }
        case "setPair": {
            const map = resolveTarget(doc, edit.at)?.node;
            if (!map || !isMap(map)) throw new Error("not a mapping");
            const pair = findPair(map, edit.key);
            if (pair) pair.value = doc.createNode(edit.value);
            else map.add(doc.createPair(edit.key, edit.value));
            return;
        }
        case "removePair": {
            const map = resolveTarget(doc, edit.at)?.node;
            if (!map || !isMap(map)) throw new Error("not a mapping");
            const pair = findPair(map, edit.key);
            map.items = map.items.filter((p) => p !== pair) as Pair[];
            return;
        }
        case "renameKey": {
            const map = resolveTarget(doc, edit.at)?.node;
            if (!map || !isMap(map)) throw new Error("not a mapping");
            const pair = findPair(map, edit.from);
            if (pair) pair.key = doc.createNode(edit.to);
            return;
        }
        case "unshare": {
            const here = resolveLocator(doc, edit.at);
            if (!here?.node || !isAlias(here.node)) throw new Error("not an alias");
            const copy = (here.node.resolve(doc) as Node).clone() as Node;
            stripAnchorsDeep(copy);
            const parent = here.parent;
            const step = edit.at[edit.at.length - 1];
            if (parent && isSeq(parent) && typeof step === "number") parent.items[step] = copy;
            else if (here.pair) here.pair.value = copy;
            return;
        }
    }
};

export interface AppliedEdit {
    text: string;
    parsed: ParsedContract;
    planned: PlannedEdit;
}

/**
 * Plans an edit, applies its patches and checks the result: it must parse
 * with no new errors, mean exactly what the edit says (`toJS` equal to the
 * edit applied to the AST) and redefine no anchor. Throws `EditBlockedError`.
 */
export const applyEdit = (parsed: ParsedContract, edit: ContractEdit): AppliedEdit => {
    const planned = planEdit(parsed, edit);
    if (planned.patches.length === 0) return { text: parsed.text, parsed, planned };
    const text = applyPatches(parsed.text, planned.patches);
    const after = parseContract(text);
    const fail = (why: string): never => {
        throw new EditBlockedError(
            `Studio couldn't apply this safely (${why}). Edit it in Source.`
        );
    };
    if (after.errors.length > 0) fail(after.errors[0]?.message ?? "parse error");
    if (after.census.redefinedAnchors.length > parsed.census.redefinedAnchors.length) {
        fail("an anchor would be defined twice");
    }
    if (after.census.mergeKeys > parsed.census.mergeKeys) fail("a merge key would be written");
    const expected = parsed.doc.clone();
    try {
        applyToAst(expected, edit);
    } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
    }
    let want: string;
    try {
        want = JSON.stringify(expected.toJS({ maxAliasCount: -1 }));
    } catch (e) {
        return fail(e instanceof Error ? e.message : String(e));
    }
    if (JSON.stringify(toPlain(after)) !== want) fail("the result differs from the edit");
    return { text, parsed: after, planned };
};

/** Applies several edits in order, each against the previous result (one undo step for the caller). */
export const applyEdits = (parsed: ParsedContract, edits: ContractEdit[]): AppliedEdit => {
    let current: AppliedEdit = {
        text: parsed.text,
        parsed,
        planned: { patches: [], impact: null },
    };
    let impact = null;
    for (const edit of edits) {
        current = applyEdit(current.parsed, edit);
        impact ??= current.planned.impact;
    }
    return { ...current, planned: { ...current.planned, impact } };
};
