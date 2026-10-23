import { ScissorsIcon } from "@heroicons/react/24/outline";

import { EDGE_KIND_IDS, EDGE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { getFreeCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    CheckField,
    PropSection,
    SelectField,
} from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import type { IEdgePropertiesProps } from "@pages/protocol-studio/ui/editor/types";

const KIND_OPTIONS = EDGE_KIND_IDS.map((kind) => ({
    value: kind,
    label: `${EDGE_KINDS[kind].label} · ${EDGE_KINDS[kind].hint}`,
}));

/**
 * The selected wire's fields: its ends, kind and strictness. Branching is
 * not decided here: a wire out of a decision node is taken on one of its cases.
 */
export const EdgeProperties = ({ edge, nodes, edges, actions }: IEdgePropertiesProps) => {
    const update = (patch: Parameters<typeof actions.updateEdge>[1]) =>
        actions.updateEdge(edge.id, patch);
    const nodeOptions = nodes.map((n) => ({ value: n.id, label: n.id }));
    const source = nodes.find((n) => n.id === edge.from);
    const cases = source?.decision?.cases;

    // The case's pin holds one wire: the one it had goes.
    const takeCase = (value: string) => {
        for (const other of edges) {
            if (other.from === edge.from && other.case === value && other.id !== edge.id) {
                actions.removeEdge(other.id);
            }
        }
        update({ case: value });
    };

    return (
        <div className="bp-props">
            <PropSection title="Wire">
                <SelectField
                    label="from"
                    value={edge.from}
                    options={nodeOptions}
                    onChange={(from) => {
                        const next = nodes.find((n) => n.id === from);
                        // Out of a decision a wire needs a case; out of anything else it has none.
                        update(
                            next?.decision
                                ? { from, kind: "branch", case: getFreeCase(next, edges) }
                                : { from, case: undefined }
                        );
                    }}
                />
                <SelectField
                    label="to"
                    value={edge.to}
                    options={nodeOptions}
                    onChange={(to) => update({ to })}
                />
                <SelectField
                    label="kind"
                    value={edge.kind}
                    options={KIND_OPTIONS}
                    wide
                    onChange={(kind) => update({ kind })}
                />
                <CheckField
                    label="mandated"
                    hint="must be followed in this order (per-domain strictness)"
                    checked={edge.mandated}
                    onChange={(mandated) => update({ mandated })}
                />
            </PropSection>

            {cases ? (
                <PropSection title="Branch">
                    <SelectField
                        label="taken on case"
                        hint={`When ${edge.from}'s decide() returns this case`}
                        value={edge.case ?? ""}
                        options={[
                            ...(edge.case !== undefined && cases.includes(edge.case)
                                ? []
                                : [{ value: "", label: "— no case: not drawn —" }]),
                            ...cases.map((value) => ({ value, label: value })),
                        ]}
                        wide
                        onChange={(value) => value && takeCase(value)}
                    />
                </PropSection>
            ) : null}

            <button
                type="button"
                className="studio-key studio-key-sm bp-props-delete"
                onClick={() => actions.removeEdge(edge.id)}
            >
                <ScissorsIcon />
                Delete wire
            </button>
        </div>
    );
};

export default EdgeProperties;
