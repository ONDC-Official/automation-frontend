import { useEffect, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CodeValidator, getFunctionSchema, MockRunnerV2 } from "@ondc/automation-mock-runner";

import { getDefaultSaveData } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";

export interface ISaveDataEditorProps {
    nodeId: string;
    /** The node's map, in v1's format. */
    saveData: Record<string, string>;
    /** The node's `defaultPayload.json` source, for JSONPath suggestions. */
    defaultPayloadSource: string;
    /** The spec's version: `city_code`'s default path differs on 1.x. */
    version: string;
    /** What the last simulated run of this node saved, if it ran. */
    lastSaved?: Record<string, unknown>;
    onChange: (saveData: Record<string, string>) => void;
}

/** One line of the table; `value` is the JSONPath, or the decoded `getSave` source. */
interface SaveDataRow {
    uid: number;
    key: string;
    /** `APPEND#key`: accumulate across repeats instead of overwriting. */
    append: boolean;
    kind: "path" | "eval";
    value: string;
}

const APPEND_PREFIX = "APPEND#";
const EVAL_PREFIX = "EVAL#";

const EVAL_TEMPLATE = `function getSave(payload) {
  // Return the value to store under this key.
  return payload.message;
}
`;

let nextUid = 0;

const decodeEval = (encoded: string) => {
    try {
        return MockRunnerV2.decodeBase64(encoded);
    } catch {
        return "// could not decode";
    }
};

/** v1 map → rows, in the map's order. */
export const toRows = (saveData: Record<string, string>): SaveDataRow[] =>
    Object.entries(saveData).map(([rawKey, rawValue]) => {
        const append = rawKey.startsWith(APPEND_PREFIX);
        const key = append ? rawKey.slice(APPEND_PREFIX.length) : rawKey;
        if (rawValue.startsWith(EVAL_PREFIX)) {
            // v1 reads `path.split("#")[1]`, so the base64 is everything after the first `#`.
            return {
                uid: ++nextUid,
                key,
                append,
                kind: "eval",
                value: decodeEval(rawValue.split("#")[1] ?? ""),
            };
        }
        return { uid: ++nextUid, key, append, kind: "path", value: rawValue };
    });

/** Rows → v1 map. Rows with an empty key are drafts and are left out. */
export const toSaveData = (rows: SaveDataRow[]): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const row of rows) {
        const key = row.key.trim();
        if (key === "") continue;
        const mapKey = row.append ? `${APPEND_PREFIX}${key}` : key;
        out[mapKey] =
            row.kind === "eval"
                ? `${EVAL_PREFIX}${MockRunnerV2.encodeBase64(row.value)}`
                : row.value;
    }
    return out;
};

/** Every JSONPath into a JSON value, arrays as `[*]`, breadth-limited. */
const collectPaths = (value: unknown, prefix: string, out: Set<string>, depth: number) => {
    if (out.size > 400 || depth > 8) return;
    if (Array.isArray(value)) {
        out.add(prefix);
        if (value.length) collectPaths(value[0], `${prefix}[*]`, out, depth + 1);
        return;
    }
    if (value && typeof value === "object") {
        if (prefix !== "$") out.add(prefix);
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            const safe = /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `['${key}']`;
            collectPaths(child, `${prefix}${safe}`, out, depth + 1);
        }
        return;
    }
    out.add(prefix);
};

const suggestPaths = (source: string): string[] => {
    try {
        const parsed: unknown = JSON.parse(source);
        const out = new Set<string>();
        collectPaths(parsed, "$", out, 0);
        return [...out];
    } catch {
        return [];
    }
};

const sameMap = (a: Record<string, string>, b: Record<string, string>) => {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    return ak.length === bk.length && ak.every((k, i) => bk[i] === k && a[k] === b[k]);
};

/**
 * The Session section: what this step writes into session data once its
 * payload exists. Edits the node's `saveData` in v1's format so configs stay
 * compatible: a key reads a JSONPath (a match list, as v1 stores it), `append`
 * accumulates across repeats, and an eval row is a `getSave(payload)` function
 * stored base64 behind `EVAL#`. Below the table, the values the last simulated
 * run saved.
 */
export const SaveDataEditor = ({
    nodeId,
    saveData,
    defaultPayloadSource,
    version,
    lastSaved,
    onChange,
}: ISaveDataEditorProps) => {
    const [rows, setRows] = useState<SaveDataRow[]>(() => toRows(saveData));
    const [selected, setSelected] = useState<number | null>(null);

    // The node's map changed underneath (an import, undo, another editor): re-read it,
    // unless it is exactly what these rows already serialise to.
    useEffect(() => {
        setRows((prev) => (sameMap(toSaveData(prev), saveData) ? prev : toRows(saveData)));
    }, [saveData]);

    const commit = (next: SaveDataRow[]) => {
        setRows(next);
        onChange(toSaveData(next));
    };
    const patch = (uid: number, change: Partial<SaveDataRow>) =>
        commit(rows.map((row) => (row.uid === uid ? { ...row, ...change } : row)));

    const paths = useMemo(() => suggestPaths(defaultPayloadSource), [defaultPayloadSource]);
    const listId = `saveData-paths-${nodeId.replace(/[^\w-]/g, "_")}`;

    const keyCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const row of rows) {
            const key = row.key.trim();
            if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return counts;
    }, [rows]);

    const defaults = getDefaultSaveData(version);
    const missingDefaults = Object.keys(defaults).filter((key) => !keyCounts.has(key));

    const addRow = (kind: SaveDataRow["kind"]) => {
        const row: SaveDataRow = {
            uid: ++nextUid,
            key: "",
            append: false,
            kind,
            value: kind === "eval" ? EVAL_TEMPLATE : "$.",
        };
        commit([...rows, row]);
        if (kind === "eval") setSelected(row.uid);
    };

    const evalRow = rows.find((row) => row.uid === selected && row.kind === "eval") ?? null;
    const evalCheck = useMemo(() => {
        if (!evalRow) return null;
        const result = CodeValidator.validate(evalRow.value, getFunctionSchema("getSave"));
        return result.isValid ? null : result.errors.join(" · ") || "Invalid getSave";
    }, [evalRow]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
                <span className="studio-eyebrow">saveData</span>
                <span className="studio-text-faint text-[11px]">
                    {rows.length === 0
                        ? "nothing is saved from this step"
                        : `${rows.length} ${rows.length === 1 ? "key" : "keys"} · read after this step's payload exists`}
                </span>
                <div className="ml-auto flex items-center gap-1">
                    {missingDefaults.length ? (
                        <button
                            type="button"
                            className="studio-key studio-key-xs"
                            title={`Adds ${missingDefaults.join(", ")}: the keys v1 gives every step, which the next steps' context is derived from`}
                            onClick={() =>
                                commit([
                                    ...rows,
                                    ...missingDefaults.map((key) => ({
                                        uid: ++nextUid,
                                        key,
                                        append: false,
                                        kind: "path" as const,
                                        value: defaults[key],
                                    })),
                                ])
                            }
                        >
                            Add defaults
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className="studio-key studio-key-xs"
                        onClick={() => addRow("path")}
                        title="A key read from the payload by JSONPath"
                    >
                        <PlusIcon />
                        Path
                    </button>
                    <button
                        type="button"
                        className="studio-key studio-key-xs"
                        onClick={() => addRow("eval")}
                        title="A key computed by a getSave(payload) function"
                    >
                        <PlusIcon />
                        Eval
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                {rows.length === 0 ? (
                    <p className="studio-text-faint px-3 py-3 text-[12px]">
                        Nothing is saved from this step yet. Add a path (e.g.{" "}
                        <span className="studio-mono">$.message.order.id</span>) or an eval, or add
                        the default keys.
                    </p>
                ) : (
                    <table className="studio-savedata">
                        <thead>
                            <tr>
                                <th>key</th>
                                <th title="APPEND#: accumulate across repeats instead of overwriting">
                                    append
                                </th>
                                <th>from</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const duplicate = (keyCounts.get(row.key.trim()) ?? 0) > 1;
                                return (
                                    <tr
                                        key={row.uid}
                                        data-selected={row.uid === selected || undefined}
                                        data-kind={row.kind}
                                        onClick={() => setSelected(row.uid)}
                                    >
                                        <td>
                                            <input
                                                className="bp-input studio-mono"
                                                value={row.key}
                                                placeholder="key"
                                                spellCheck={false}
                                                aria-invalid={duplicate || undefined}
                                                title={
                                                    duplicate
                                                        ? "Duplicate key: the last one wins"
                                                        : undefined
                                                }
                                                onChange={(e) =>
                                                    patch(row.uid, { key: e.target.value })
                                                }
                                            />
                                        </td>
                                        <td className="text-center">
                                            <input
                                                type="checkbox"
                                                checked={row.append}
                                                aria-label="append"
                                                onChange={(e) =>
                                                    patch(row.uid, { append: e.target.checked })
                                                }
                                            />
                                        </td>
                                        <td>
                                            {row.kind === "path" ? (
                                                <input
                                                    className="bp-input studio-mono"
                                                    value={row.value}
                                                    placeholder="$.context.transaction_id"
                                                    spellCheck={false}
                                                    list={listId}
                                                    onChange={(e) =>
                                                        patch(row.uid, { value: e.target.value })
                                                    }
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="studio-key studio-key-xs w-full justify-start"
                                                    data-active={row.uid === selected || undefined}
                                                    onClick={() => setSelected(row.uid)}
                                                    title="Edit getSave(payload) below"
                                                >
                                                    ƒ getSave(payload)
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="studio-key studio-key-xs studio-key-icon"
                                                aria-label="Remove key"
                                                title="Remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (selected === row.uid) setSelected(null);
                                                    commit(rows.filter((r) => r.uid !== row.uid));
                                                }}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {paths.length ? (
                    <datalist id={listId}>
                        {paths.map((path) => (
                            <option key={path} value={path} />
                        ))}
                    </datalist>
                ) : null}

                {lastSaved ? (
                    <section className="studio-hairline-t px-3 py-2">
                        <p className="studio-eyebrow">Last run</p>
                        <pre className="studio-mono studio-savedata-last">
                            {JSON.stringify(lastSaved, null, 2)}
                        </pre>
                    </section>
                ) : null}
            </div>

            {evalRow ? (
                <div className="studio-hairline-t flex min-h-0 flex-[0_0_45%] flex-col">
                    <div className="flex items-center gap-2 px-3 py-1">
                        <span className="studio-eyebrow">
                            getSave · <span className="studio-mono">{evalRow.key || "(key)"}</span>
                        </span>
                        <span
                            className="studio-text-faint ml-auto text-[11px]"
                            data-tone={evalCheck ? "error" : "ok"}
                        >
                            {evalCheck ?? "JavaScript · stored as EVAL#"}
                        </span>
                    </div>
                    <div className="min-h-0 flex-1">
                        <InspectorCodePane
                            path={`studio://${encodeURIComponent(nodeId)}/saveData/${evalRow.uid}.js`}
                            language="javascript"
                            value={evalRow.value}
                            onChange={(value) => patch(evalRow.uid, { value })}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default SaveDataEditor;
