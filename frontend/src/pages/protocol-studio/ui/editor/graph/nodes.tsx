import { memo } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";

import { NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { getCasePin } from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    EXEC_PIN_TOP,
    getCasePinTop,
    getPinLeft,
    getNodeRows,
} from "@pages/protocol-studio/ui/editor/graph/layout";
import type {
    PinId,
    StudioDecision,
    StudioGraphNode,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

const ExecPin = ({
    id,
    wired,
    top = EXEC_PIN_TOP,
}: {
    id: PinId;
    wired: PinId[];
    top?: number;
}) => {
    const isSource = id !== "in";
    return (
        <Handle
            id={id}
            type={isSource ? "source" : "target"}
            position={isSource ? Position.Right : Position.Left}
            className="bp-exec"
            data-wired={wired.includes(id) || undefined}
            style={{ top, left: getPinLeft(id), right: "auto" }}
        />
    );
};

/**
 * A decision, drawn like Blueprint's "Switch on Enum": In ▸ on the left, then
 * one out pin per case down the right. `decide` returns a case, and the wire
 * on that case's pin is the branch taken.
 */
const DecisionNode = ({
    node,
    decision,
    isSelected,
    wired,
}: {
    node: StudioNode;
    decision: StudioDecision;
    isSelected: boolean;
    wired: PinId[];
}) => {
    const { Icon } = NODE_KINDS.decision;
    const isInput = decision.mode === "input";
    return (
        <div
            className="bp-node"
            data-kind="decision"
            data-selected={isSelected || undefined}
            title={node.description || undefined}
        >
            <header className="bp-head">
                <span className="bp-head-icon">
                    <Icon />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="bp-title">{node.id}</p>
                    <p className="bp-sub">
                        <span>Decision</span>
                        <span className="bp-flag">{isInput ? "user input" : "session"}</span>
                    </p>
                </div>
            </header>
            <div className="bp-exec-row">
                <span className="bp-pin-label">In</span>
                <span className="bp-pin-label bp-decide-sig">
                    {isInput ? "decide(input, sessionData)" : "decide(sessionData)"}
                </span>
            </div>
            {decision.cases.map((value) => (
                <div
                    key={value}
                    className="bp-case-row"
                    data-wired={wired.includes(getCasePin(value)) || undefined}
                >
                    <span className="bp-case-value" title={value}>
                        {value}
                    </span>
                </div>
            ))}
            <ExecPin id="in" wired={wired} />
            {decision.cases.map((value, index) => (
                <ExecPin
                    key={value}
                    id={getCasePin(value)}
                    wired={wired}
                    top={getCasePinTop(index)}
                />
            ))}
        </div>
    );
};

const NodeRows = ({ node }: { node: StudioNode }) =>
    getNodeRows(node).map((row) => (
        <div key={row.key} className="bp-row" data-tone={row.tone}>
            <span className="bp-dot" aria-hidden="true" />
            <span className="bp-row-label">{row.label}</span>
            <span className="bp-row-value" title={row.value}>
                {row.value}
            </span>
        </div>
    ));

/**
 * One API call, drawn like an Unreal Blueprint node: a header tinted by kind,
 * an exec row (In ▸ on the left, Then ▸ on the right) that wires drag between,
 * then a row per property the node sets. Pins fill once something is wired.
 * A request and its callback (`search`, `on_search`) are two nodes, wired
 * by a response wire.
 */
const BlueprintNodeBase = ({ data }: NodeProps<StudioGraphNode>) => {
    const { node, isSelected, wired } = data;

    if (node.decision) {
        return (
            <DecisionNode
                node={node}
                decision={node.decision}
                isSelected={isSelected}
                wired={wired}
            />
        );
    }

    const { Icon, label } = NODE_KINDS[node.kind];
    return (
        <div
            className="bp-node"
            data-kind={node.kind}
            data-selected={isSelected || undefined}
            data-optional={node.optional || undefined}
            title={node.description || undefined}
        >
            <header className="bp-head">
                <span className="bp-head-icon">
                    <Icon />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="bp-title">{node.api}</p>
                    <p className="bp-sub">
                        {node.id !== node.api ? <span className="bp-sub-id">{node.id}</span> : null}
                        <span>{label}</span>
                        {node.manual ? <span className="bp-flag">manual</span> : null}
                        {node.optional ? <span className="bp-flag">optional</span> : null}
                    </p>
                </div>
                <span className="studio-owner bp-owner" data-owner={node.owner}>
                    {node.owner}
                </span>
            </header>
            <div className="bp-exec-row">
                <span className="bp-pin-label">In</span>
                <span className="bp-pin-label bp-pin-label-out">Then</span>
            </div>
            <NodeRows node={node} />
            <ExecPin id="in" wired={wired} />
            <ExecPin id="out" wired={wired} />
        </div>
    );
};

export const NODE_TYPES: NodeTypes = {
    studioNode: memo(BlueprintNodeBase),
};
