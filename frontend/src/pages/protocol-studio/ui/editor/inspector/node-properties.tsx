import { TrashIcon } from "@heroicons/react/24/outline";

import { getTemplateFiles } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { API_NODE_KIND_IDS, NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    CheckField,
    JsonField,
    PropSection,
    SelectField,
    splitList,
    TextField,
} from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import type { INodePropertiesProps, NodeOwner } from "@pages/protocol-studio/ui/editor/types";

const NONE = "";

const OWNER_OPTIONS: { value: NodeOwner; label: string }[] = [
    { value: "BAP", label: "BAP · buyer app" },
    { value: "BPP", label: "BPP · seller app" },
];

const KIND_OPTIONS = API_NODE_KIND_IDS.map((kind) => ({
    value: kind,
    label: NODE_KINDS[kind].label,
}));

/** repeat.max when repeat-until is switched on without a cap. */
const DEFAULT_UNTIL_MAX = 10;

/** `""` → unset, else a whole number. */
const parseOptionalInt = (text: string): { value?: number; error: string | null } => {
    if (text.trim() === "") return { error: null };
    const n = Number(text);
    return Number.isInteger(n) ? { value: n, error: null } : { error: "A whole number" };
};

/**
 * The selected node's own fields as a form. Simple fields apply as you type;
 * the id applies on blur / Enter (renaming rewires everything pointing at it);
 * examples are free JSON.
 */
export const NodeProperties = ({
    node,
    nodes,
    wiredInto,
    actions,
    onEditFile,
}: INodePropertiesProps) => {
    const update = (patch: Parameters<typeof actions.updateNode>[1]) =>
        actions.updateNode(node.id, patch);
    const others = nodes.filter((n) => n.id !== node.id);
    const nodeOptions = [
        { value: NONE, label: "— none —" },
        ...others.map((n) => ({ value: n.id, label: n.id })),
    ];

    return (
        <div className="bp-props">
            <PropSection title="Identity">
                <TextField
                    label="id"
                    hint="Unique on the graph; renaming rewires edges and references"
                    value={node.id}
                    mono
                    onCommit={(value) => actions.renameNode(node.id, value)}
                />
                <TextField label="api" value={node.api} mono onChange={(api) => update({ api })} />
                <SelectField
                    label="kind"
                    value={node.kind}
                    options={KIND_OPTIONS}
                    onChange={(kind) => update({ kind })}
                />
                <SelectField
                    label="owner"
                    value={node.owner}
                    options={OWNER_OPTIONS}
                    onChange={(owner) => update({ owner })}
                />
                <SelectField
                    label="responseFor"
                    hint="The request this node answers"
                    value={node.responseFor ?? NONE}
                    options={nodeOptions}
                    wide
                    onChange={(id) => update({ responseFor: id === NONE ? null : id })}
                />
                <TextField
                    label="description"
                    value={node.description}
                    multiline
                    onChange={(description) => update({ description })}
                />
                <TextField
                    label="usecases"
                    hint="Comma-separated; empty means every use case"
                    value={node.usecases?.join(", ") ?? ""}
                    placeholder="all use cases"
                    wide
                    onCommit={(text) => {
                        const list = splitList(text);
                        update({ usecases: list.length > 0 ? list : undefined });
                        return null;
                    }}
                />
                <TextField
                    label="helperModules"
                    hint="Comma-separated helper modules this node's code uses"
                    value={node.helperModules?.join(", ") ?? ""}
                    placeholder="none"
                    mono
                    wide
                    onCommit={(text) => {
                        const list = splitList(text);
                        update({ helperModules: list.length > 0 ? list : undefined });
                        return null;
                    }}
                />
            </PropSection>

            <PropSection title="Behaviour">
                <CheckField
                    label="start"
                    hint={
                        wiredInto && !node.start
                            ? "only a node nothing wires into can start a journey"
                            : "a journey may begin here"
                    }
                    checked={node.start ?? false}
                    disabled={wiredInto && !node.start}
                    onChange={(start) => update({ start: start || undefined })}
                />
                <CheckField
                    label="end"
                    hint="a transaction may finish here, even though wires lead on"
                    checked={node.end ?? false}
                    onChange={(end) => update({ end: end || undefined })}
                />
                <CheckField
                    label="manual"
                    hint="needs an explicit UI trigger"
                    checked={node.manual ?? false}
                    onChange={(manual) => update({ manual: manual || undefined })}
                />
                <CheckField
                    label="optional"
                    hint="skipping it is not “missed”"
                    checked={node.optional ?? false}
                    onChange={(optional) => update({ optional: optional || undefined })}
                />
                <CheckField
                    label="repeat"
                    hint="may run more than once"
                    checked={node.repeat !== undefined}
                    onChange={(on) => update({ repeat: on ? { max: "unbounded" } : undefined })}
                />
                <CheckField
                    label="repeat until exit()"
                    hint="runs again, right after itself, until exit.ts returns true"
                    checked={node.repeat?.until ?? false}
                    onChange={(on) => {
                        if (!on) {
                            if (node.repeat)
                                update({ repeat: { ...node.repeat, until: undefined } });
                            return;
                        }
                        update({
                            repeat: {
                                ...node.repeat,
                                // A cap, so a status that never arrives fails the run instead of looping.
                                max:
                                    node.repeat && node.repeat.max !== "unbounded"
                                        ? node.repeat.max
                                        : DEFAULT_UNTIL_MAX,
                                until: true,
                            },
                        });
                        if (!(node.files.exit ?? "").trim()) {
                            actions.updateNodeFile(
                                node.id,
                                "exit",
                                getTemplateFiles(node.api, node.codeLanguage ?? "typescript").exit
                            );
                        }
                        onEditFile("exit");
                    }}
                />
                <TextField
                    label="priority"
                    value={node.priority === undefined ? "" : String(node.priority)}
                    placeholder="unset"
                    onCommit={(text) => {
                        const { value, error } = parseOptionalInt(text);
                        if (!error) update({ priority: value });
                        return error;
                    }}
                />
                {node.repeat ? (
                    <>
                        <TextField
                            label="repeat.max"
                            hint={
                                node.repeat.until
                                    ? "Runs before the exit condition must hold; reaching it fails the run"
                                    : "A count, or “unbounded”"
                            }
                            value={String(node.repeat.max)}
                            onCommit={(text) => {
                                const t = text.trim();
                                if (t === "unbounded" || t === "∞" || t === "") {
                                    update({ repeat: { ...node.repeat, max: "unbounded" } });
                                    return null;
                                }
                                const n = Number(t);
                                if (!Number.isInteger(n) || n < 1)
                                    return "A count ≥ 1, or “unbounded”";
                                update({ repeat: { ...node.repeat, max: n } });
                                return null;
                            }}
                        />
                        <SelectField
                            label="repeat.resetOn"
                            hint="The node whose run resets the count"
                            value={node.repeat.resetOn ?? NONE}
                            options={nodeOptions}
                            onChange={(id) =>
                                update({
                                    repeat: {
                                        max: node.repeat?.max ?? "unbounded",
                                        ...(node.repeat?.until ? { until: true } : {}),
                                        ...(id === NONE ? {} : { resetOn: id }),
                                    },
                                })
                            }
                        />
                    </>
                ) : null}
            </PropSection>

            <PropSection title="Errors & negative journeys">
                <TextField
                    label="error.code"
                    hint="Makes this an async error on_X"
                    value={node.error?.code ?? ""}
                    placeholder="none"
                    mono
                    onCommit={(code) => {
                        const c = code.trim();
                        update({ error: c ? { ...node.error, code: c } : undefined });
                        return null;
                    }}
                />
                <TextField
                    label="error.message"
                    value={node.error?.message ?? ""}
                    placeholder={node.error ? "optional" : "set a code first"}
                    onChange={(message) =>
                        node.error &&
                        update({ error: { ...node.error, message: message || undefined } })
                    }
                />
                <TextField
                    label="expects.nack"
                    hint="Negative journey: the NP must NACK with this code"
                    value={node.expects?.nack ?? ""}
                    placeholder="none"
                    mono
                    onCommit={(nack) => {
                        const c = nack.trim();
                        update({ expects: c ? { ...node.expects, nack: c } : undefined });
                        return null;
                    }}
                />
                <TextField
                    label="expects.path"
                    hint="JSONPath of the field it violates"
                    value={node.expects?.path ?? ""}
                    placeholder={node.expects ? "$.message.…" : "set a NACK code first"}
                    mono
                    onChange={(path) =>
                        node.expects &&
                        update({ expects: { ...node.expects, path: path || undefined } })
                    }
                />
            </PropSection>

            <PropSection title="Examples">
                <JsonField
                    label="examples"
                    value={node.examples}
                    placeholder="[]"
                    onChange={(examples) => update({ examples })}
                />
            </PropSection>

            <button
                type="button"
                className="studio-key studio-key-sm bp-props-delete"
                onClick={() => actions.removeNode(node.id)}
            >
                <TrashIcon />
                Delete node
            </button>
        </div>
    );
};

export default NodeProperties;
