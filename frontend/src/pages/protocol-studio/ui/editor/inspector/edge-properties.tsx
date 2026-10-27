import { ScissorsIcon } from "@heroicons/react/24/outline";

import { EDGE_KIND_IDS, EDGE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { getFreeCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    CheckField,
    PropSection,
    SelectField,
    TextField,
} from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import {
    GROUP_IN,
    GROUP_OUT,
    type IEdgePropertiesProps,
} from "@pages/protocol-studio/ui/editor/types";

const KIND_OPTIONS = EDGE_KIND_IDS.map((kind) => ({
    value: kind,
    label: `${EDGE_KINDS[kind].label} · ${EDGE_KINDS[kind].hint}`,
}));

/**
 * The selected wire's fields: its ends, label, kind and strictness. A wire
 * out of a decision is taken on one of its cases; one of several wires out of
 * an API node is an alternative, and its label is what tells them apart.
 */
export const EdgeProperties = ({ edge, nodes, edges, inGroup, actions }: IEdgePropertiesProps) => {
    const update = (patch: Parameters<typeof actions.updateEdge>[1]) =>
        actions.updateEdge(edge.id, patch);
    const nodeOptions = nodes.map((n) => ({ value: n.id, label: n.id }));
    const fromOptions = inGroup
        ? [{ value: GROUP_IN, label: "Entry (the group's In pin)" }, ...nodeOptions]
        : nodeOptions;
    const toOptions = inGroup
        ? [...nodeOptions, { value: GROUP_OUT, label: "Exit (the group's Then pin)" }]
        : nodeOptions;
    const source = nodes.find((n) => n.id === edge.from);
    const cases = source?.decision?.cases;
    const siblings = edges.filter((e) => e.from === edge.from && e.case === edge.case);
    const isAlternative = !cases && siblings.length >= 2;

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
                    options={fromOptions}
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
                    options={toOptions}
                    onChange={(to) => update({ to })}
                />
                <TextField
                    label="label"
                    hint={
                        isAlternative
                            ? "Name this alternative — journeys are named from it"
                            : "An optional name shown on the wire"
                    }
                    value={edge.label ?? ""}
                    placeholder={isAlternative ? "e.g. out of stock" : "none"}
                    wide
                    onChange={(label) => update({ label: label || undefined })}
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

            {isAlternative ? (
                <PropSection title="Alternative">
                    <p className="bp-props-note" style={{ gridColumn: "span 2" }}>
                        {edge.from} has {siblings.length} wires out of its Then pin. The protocol
                        permits any of them; nothing here decides which. A journey picks one in the
                        Journeys stage, or the tester is asked at run time.
                    </p>
                </PropSection>
            ) : null}

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
