import { CodeBracketIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { checkCaseName, getCaseWires } from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    PropSection,
    SelectField,
    TextField,
} from "@pages/protocol-studio/ui/editor/inspector/property-fields";
import type {
    DecisionMode,
    IDecisionPropertiesProps,
} from "@pages/protocol-studio/ui/editor/types";

const MODE_OPTIONS: { value: DecisionMode; label: string }[] = [
    { value: "session", label: "Session data · decide(sessionData)" },
    { value: "input", label: "User input · the tester picks a case" },
];

/** An unused case name: `case_3`, `case_4`, … */
const nextCaseName = (cases: string[]) => {
    let n = cases.length + 1;
    while (cases.includes(`case_${n}`)) n += 1;
    return `case_${n}`;
};

/**
 * A decision node's fields: where it decides from, its cases (one out pin
 * each, and the values `decide` may return), and in input mode what the
 * tester is asked. Case edits keep the wires and decide.ts's signature in step.
 */
export const DecisionProperties = ({
    node,
    edges,
    actions,
    onEditCode,
}: IDecisionPropertiesProps) => {
    const { decision } = node;
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
                <SelectField
                    label="decides from"
                    value={decision.mode}
                    options={MODE_OPTIONS}
                    wide
                    onChange={(mode) =>
                        update(node.id, {
                            mode,
                            input:
                                mode === "input"
                                    ? (decision.input ?? {
                                          id: `${node.id}_choice`,
                                          label: "Which way should the flow go?",
                                      })
                                    : decision.input,
                        })
                    }
                />
                <TextField
                    label="description"
                    value={node.description}
                    multiline
                    onChange={(description) => actions.updateNode(node.id, { description })}
                />
            </PropSection>

            {decision.mode === "input" && decision.input ? (
                <PropSection title="User input">
                    <TextField
                        label="input.id"
                        hint="Saved as sessionData.user_inputs[id]; decide gets it as `input`"
                        value={decision.input.id}
                        mono
                        onCommit={(text) => {
                            const id = text.trim();
                            if (!/^[A-Za-z_][\w]*$/.test(id)) return "Letters, digits and _ only";
                            update(node.id, { input: { ...decision.input!, id } });
                            return null;
                        }}
                    />
                    <TextField
                        label="input.label"
                        hint="The question the tester sees; the choices are the cases"
                        value={decision.input.label}
                        wide
                        onChange={(label) =>
                            update(node.id, { input: { ...decision.input!, label } })
                        }
                    />
                </PropSection>
            ) : null}

            <PropSection title="Cases">
                <div className="bp-cases">
                    {decision.cases.map((value, index) => {
                        const wire = wires.get(value);
                        const others = decision.cases.filter((_, i) => i !== index);
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
                                        const cases = decision.cases.map((c, i) =>
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
                                    disabled={decision.cases.length === 1}
                                    onClick={() =>
                                        update(node.id, {
                                            cases: decision.cases.filter((_, i) => i !== index),
                                        })
                                    }
                                    aria-label={`Remove case ${value}`}
                                    title={
                                        decision.cases.length === 1
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
                            update(node.id, {
                                cases: [...decision.cases, nextCaseName(decision.cases)],
                            })
                        }
                    >
                        <PlusIcon />
                        Add case
                    </button>
                    <p className="bp-props-note">
                        {decision.mode === "input"
                            ? "The tester picks one of these cases; decide(input, sessionData) maps the answer to the case whose wire is followed."
                            : "decide(sessionData) returns one of these cases; the wire on that case's pin is followed."}{" "}
                        decide.ts's return type follows this list.
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
