import { memo } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import {
    ArrowRightEndOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

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
    StudioGraphNode,
    StudioGroup,
    StudioNode,
    StudioDecision,
    RunStatus,
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

/** Start / End marks, shown as flags beside the node's kind. */
const EndpointFlags = ({ node }: { node: StudioNode }) => (
    <>
        {node.start ? (
            <span className="bp-flag" data-flag="start" title="Start: a journey may begin here">
                start
            </span>
        ) : null}
        {node.end ? (
            <span className="bp-flag" data-flag="end" title="End: a transaction may finish here">
                end
            </span>
        ) : null}
    </>
);

type Common = {
    node: StudioNode;
    isSelected: boolean;
    wired: PinId[];
    lit?: boolean;
    runStatus?: RunStatus;
};

/**
 * A decision, drawn like Blueprint's "Switch on Enum": In ▸ on the left, then
 * one out pin per case down the right. `decide(sessionData)` returns a case,
 * and the wire on that case's pin is the branch taken. The protocol decides
 * here — never the tester.
 */
const DecisionNode = ({
    node,
    dec,
    isSelected,
    wired,
    lit,
    runStatus,
}: Common & { dec: StudioDecision }) => {
    const { Icon } = NODE_KINDS.decision;
    return (
        <div
            className="bp-node"
            data-kind="decision"
            data-selected={isSelected || undefined}
            data-lit={lit}
            data-run={runStatus}
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
                        <span className="bp-flag">state</span>
                        <EndpointFlags node={node} />
                    </p>
                </div>
            </header>
            <div className="bp-exec-row">
                <span className="bp-pin-label">In</span>
                <span className="bp-pin-label bp-decide-sig">decide(sessionData)</span>
            </div>
            {dec.cases.map((value) => (
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
            {dec.cases.map((value, index) => (
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

/** How many forks (pins with ≥2 wires, decisions) a group holds, counted one level down. */
const countForks = (group: StudioGroup) => {
    const perPin = new Map<string, number>();
    let forks = 0;
    for (const node of group.graph.nodes) if (node.decision) forks += 1;
    for (const edge of group.graph.edges) {
        if (edge.case !== undefined) continue;
        perPin.set(edge.from, (perPin.get(edge.from) ?? 0) + 1);
    }
    for (const n of perPin.values()) if (n >= 2) forks += 1;
    return forks;
};

/**
 * A collapsed sub-protocol, drawn like a Blueprint function call: its name,
 * two lines of description, and what it holds. Double-click enters it.
 */
const GroupNode = ({ node, group, isSelected, wired, lit }: Common & { group: StudioGroup }) => {
    const { Icon } = NODE_KINDS.group;
    const forks = countForks(group);
    const count = group.graph.nodes.length;
    return (
        <div
            className="bp-node bp-group"
            data-kind="group"
            data-selected={isSelected || undefined}
            data-lit={lit}
            title={`${group.name}\n${group.description}\n\nDouble-click to open`}
        >
            <header className="bp-head">
                <span className="bp-head-icon">
                    <Icon />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="bp-title">{group.name || node.id}</p>
                    <p className="bp-sub">
                        {group.name && group.name !== node.id ? (
                            <span className="bp-sub-id">{node.id}</span>
                        ) : null}
                        <span>Sub-protocol</span>
                    </p>
                </div>
            </header>
            <div className="bp-exec-row">
                <span className="bp-pin-label">In</span>
                <span className="bp-pin-label bp-pin-label-out">Then</span>
            </div>
            <p className="bp-group-desc" data-empty={group.description ? undefined : true}>
                {group.description ||
                    "No description yet — add one so readers know what this covers."}
            </p>
            <p className="bp-group-stats">
                <span>
                    {count} {count === 1 ? "node" : "nodes"}
                </span>
                <span>·</span>
                <span>
                    {forks} {forks === 1 ? "fork" : "forks"}
                </span>
                <span className="ml-auto">open ⤵</span>
            </p>
            <ExecPin id="in" wired={wired} />
            <ExecPin id="out" wired={wired} />
        </div>
    );
};

/** A group's Entry or Exit, inside it: where the outer wires come in and go out. */
const BoundaryNode = ({ side, wired }: { side: "in" | "out"; wired: PinId[] }) => (
    <div className="bp-node bp-boundary" data-kind="group" data-side={side}>
        <header className="bp-head">
            <span className="bp-head-icon">
                {side === "in" ? (
                    <ArrowRightEndOnRectangleIcon />
                ) : (
                    <ArrowRightStartOnRectangleIcon />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="bp-title">{side === "in" ? "Entry" : "Exit"}</p>
                <p className="bp-sub">
                    <span>{side === "in" ? "the group's In pin" : "the group's Then pin"}</span>
                </p>
            </div>
        </header>
        <div className="bp-exec-row">
            <span className="bp-pin-label">{side === "in" ? "" : "In"}</span>
            <span className="bp-pin-label bp-pin-label-out">{side === "in" ? "Then" : ""}</span>
        </div>
        {side === "in" ? <ExecPin id="out" wired={wired} /> : <ExecPin id="in" wired={wired} />}
    </div>
);

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
 * A Then pin with several wires is a fork of alternatives: the badge says so.
 */
const BlueprintNodeBase = ({ data }: NodeProps<StudioGraphNode>) => {
    const { node, isSelected, wired, fanOut, lit, boundary, runStatus } = data;

    if (boundary) return <BoundaryNode side={boundary} wired={wired} />;
    if (node.decision) {
        return (
            <DecisionNode
                node={node}
                dec={node.decision}
                isSelected={isSelected}
                wired={wired}
                lit={lit}
                runStatus={runStatus}
            />
        );
    }
    if (node.group) {
        return (
            <GroupNode
                node={node}
                group={node.group}
                isSelected={isSelected}
                wired={wired}
                lit={lit}
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
            data-lit={lit}
            data-run={runStatus}
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
                        <EndpointFlags node={node} />
                    </p>
                </div>
                <span className="studio-owner bp-owner" data-owner={node.owner}>
                    {node.owner}
                </span>
            </header>
            <div className="bp-exec-row">
                <span className="bp-pin-label">In</span>
                {fanOut >= 2 ? (
                    <span
                        className="bp-fork-badge"
                        title={`${fanOut} alternatives: the protocol permits any of them. A journey picks one.`}
                    >
                        ⑂ {fanOut}
                    </span>
                ) : null}
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
