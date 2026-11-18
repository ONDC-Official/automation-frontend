import { CodeBracketIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { checkCaseName, getCaseWires } from "@pages/protocol-studio/ui/editor/graph/decision";
import { PropSection, TextField } from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import type { IDecisionPropertiesProps } from "@pages/protocol-studio/ui/editor/types";

/** An unused case name: `case_3`, `case_4`, … */
const nextCaseName = (cases: string[]) => {
    let n = cases.length + 1;
    while (cases.includes(`case_${n}`)) n += 1;
    return `case_${n}`;
};

/**
 * A decision node's fields: its cases (one out pin each, and the values
 * `decide` may return). Case edits keep the wires and decide.ts's return type
 * in step. A decision reads state only; what the tester picks is never here.
 */
export const DecisionProperties = ({
    node,
    edges,
    actions,
    onEditCode,
}: IDecisionPropertiesProps) => {
    const dec = node.decision;
    const wires = getCaseWires(node.id, edges);
    const update = actions.updateDecision;

    return (
        <div className="bp-props">
            <PropSection title="Identity">
                <TextField
                    label="id"
                    hint="Unique on the graph; renaming rewires edges"
                    value={node.id}
                    mono
                    onCommit={(value) => actions.renameNode(node.id, value)}
                />
                <TextField
                    label="description"
                    hint="What state this decision reads, and why the protocol forks here"
                    value={node.description}
                    multiline
                    onChange={(description) => actions.updateNode(node.id, { description })}
                />
            </PropSection>

            <PropSection title="Cases">
                <div className="bp-cases">
                    {dec.cases.map((value, index) => {
                        const wire = wires.get(value);
                        const others = dec.cases.filter((_, i) => i !== index);
                        return (
                            <div key={index} className="bp-case-edit">
                                <TextField
                                    label={`case ${index + 1}`}
                                    value={value}
                                    mono
                                    onCommit={(text) => {
                                        const next = text.trim();
                                        if (next === value) return null;
                                        const problem = checkCaseName(next, others);
                                        if (problem) return problem;
                                        const cases = dec.cases.map((c, i) =>
                                            i === index ? next : c
                                        );
                                        update(node.id, { cases }, [value, next]);
                                        return null;
                                    }}
                                />
                                <span
                                    className="bp-case-target"
                                    data-unwired={wire ? undefined : true}
                                    title={
                                        wire ? `Taken to ${wire.to}` : "Nothing wired to this case"
                                    }
                                >
                                    {wire ? `→ ${wire.to}` : "not wired"}
                                </span>
                                <button
                                    type="button"
                                    className="studio-key studio-key-icon"
                                    disabled={dec.cases.length === 1}
                                    onClick={() =>
                                        update(node.id, {
                                            cases: dec.cases.filter((_, i) => i !== index),
                                        })
                                    }
                                    aria-label={`Remove case ${value}`}
                                    title={
                                        dec.cases.length === 1
                                            ? "A decision needs at least one case"
                                            : "Remove the case and its wire"
                                    }
                                >
                                    <XMarkIcon />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        type="button"
                        className="studio-key studio-key-sm"
                        onClick={() =>
                            update(node.id, { cases: [...dec.cases, nextCaseName(dec.cases)] })
                        }
                    >
                        <PlusIcon />
                        Add case
                    </button>
                    <p className="bp-props-note">
                        decide(sessionData) returns one of these cases; the wire on that case's pin
                        is followed. decide.ts's return type follows this list.
                    </p>
                    <p className="bp-props-note">
                        Is the choice something the mock cannot know from state (stock, a rider, a
                        user's mind)? Then it is not a decision: wire the alternatives straight out
                        of the previous node, and pick between them in a journey.
                    </p>
                    <button type="button" className="studio-key studio-key-sm" onClick={onEditCode}>
                        <CodeBracketIcon />
                        Edit decide.ts
                    </button>
                </div>
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

export default DecisionProperties;
