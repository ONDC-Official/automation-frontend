import { Position, type NodeHandle, type XYPosition } from "@xyflow/react";

import { getCasePin, getPinCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import type {
    GraphSelection,
    PinId,
    StudioGraph,
    StudioGraphEdge,
    StudioGraphNode,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * Blueprint node metrics. Every size is fixed — a header, the exec-pin row,
 * then one row per property the node sets — so nodes carry explicit width /
 * height and React Flow never has to measure them before showing them. Keep
 * in sync with the `.bp-*` rules in studio-editor.css.
 */
export const BP = {
    width: 236,
    header: 40,
    execRow: 28,
    row: 20,
    /** A decision's case rows, one out pin each. */
    caseRow: 24,
    padding: 8,
    /** Exec pins: their size, and how far they sit in from the node's side. */
    pin: 13,
    pinInset: 9,
    /** Space left between a node and one placed beside it. */
    gap: 72,
} as const;

/** Where the exec pins sit: the middle of the row under the header. */
export const EXEC_PIN_TOP = BP.header + BP.execRow / 2;

export type NodeRowTone = "response" | "guard" | "effect" | "repeat" | "error" | "nack" | "meta";

export interface NodeRow {
    key: string;
    label: string;
    value: string;
    tone: NodeRowTone;
}

/** The property rows under a node's exec pins, like a Blueprint node's data pins. */
export const getNodeRows = (node: StudioNode): NodeRow[] => {
    const rows: NodeRow[] = [];
    if (node.responseFor) {
        rows.push({
            key: "responseFor",
            label: "response for",
            value: node.responseFor,
            tone: "response",
        });
    }
    if (node.guard !== undefined) {
        rows.push({ key: "guard", label: "guard", value: "ƒ predicate", tone: "guard" });
    }
    if (node.effects.length > 0) {
        rows.push({
            key: "effects",
            label: "effects",
            value: String(node.effects.length),
            tone: "effect",
        });
    }
    if (node.repeat) {
        const max = node.repeat.max === "unbounded" ? "∞" : `≤ ${node.repeat.max}`;
        const reset = node.repeat.resetOn ? ` ↺ ${node.repeat.resetOn}` : "";
        rows.push({ key: "repeat", label: "repeat", value: `${max}${reset}`, tone: "repeat" });
    }
    if (node.error) {
        rows.push({ key: "error", label: "error", value: node.error.code, tone: "error" });
    }
    if (node.expects) {
        rows.push({
            key: "expects",
            label: "expects NACK",
            value: node.expects.nack,
            tone: "nack",
        });
    }
    if (node.priority !== undefined) {
        rows.push({
            key: "priority",
            label: "priority",
            value: String(node.priority),
            tone: "meta",
        });
    }
    if (node.usecases && node.usecases.length > 0) {
        rows.push({
            key: "usecases",
            label: "usecases",
            value: node.usecases.join(", "),
            tone: "meta",
        });
    }
    return rows;
};

/** Where case `index`'s out pin sits down a decision node. */
export const getCasePinTop = (index: number) =>
    BP.header + BP.execRow + index * BP.caseRow + BP.caseRow / 2;

/** The height of a node as drawn: its rows, or a decision's cases. */
export const getNodeHeight = (node: StudioNode) =>
    BP.header +
    BP.execRow +
    (node.decision ? node.decision.cases.length * BP.caseRow : getNodeRows(node).length * BP.row) +
    BP.padding;

/** Where a pin sits across a node: In on the left, every out pin on the right. */
export const getPinLeft = (pin: PinId) =>
    pin === "in" ? BP.pinInset : BP.width - BP.pinInset - BP.pin;

export interface GraphRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Where a node is drawn. */
export const getNodeRect = (node: StudioNode): GraphRect => ({
    ...node.position,
    width: BP.width,
    height: getNodeHeight(node),
});

/** The box around every node as drawn; null for an empty graph. */
export const getGraphBounds = (graph: StudioGraph): GraphRect | null => {
    const rects = graph.nodes.map(getNodeRect);
    if (rects.length === 0) return null;
    const x = Math.min(...rects.map((rect) => rect.x));
    const y = Math.min(...rects.map((rect) => rect.y));
    return {
        x,
        y,
        width: Math.max(...rects.map((rect) => rect.x + rect.width)) - x,
        height: Math.max(...rects.map((rect) => rect.y + rect.height)) - y,
    };
};

/** Where a node's In (target) or Then (source) pin is, in graph coordinates. */
export const getPinPoint = (node: StudioNode, side: "source" | "target"): XYPosition => ({
    x: node.position.x + (side === "source" ? BP.width : 0),
    y: node.position.y + EXEC_PIN_TOP,
});

const handle = (id: PinId, top = EXEC_PIN_TOP): NodeHandle => {
    const isSource = id !== "in";
    return {
        id,
        type: isSource ? "source" : "target",
        position: isSource ? Position.Right : Position.Left,
        x: getPinLeft(id),
        y: top - BP.pin / 2,
        width: BP.pin,
        height: BP.pin,
    };
};

/**
 * React Flow nodes and edges for the graph. Every wire runs exec-out → exec-in;
 * out of a decision, from the pin of the case it is taken on.
 *
 * Nodes carry their size (`measured`) and pins (`handles`) up front: without
 * them React Flow forgets the pin positions whenever a node object is replaced,
 * which is every frame of a drag, and the wires blink until it re-measures.
 */
export const buildGraph = (
    graph: StudioGraph,
    selection: GraphSelection
): { nodes: StudioGraphNode[]; edges: StudioGraphEdge[] } => {
    const selectedNode = selection?.type === "node" ? selection.id : null;
    const wired = new Set<string>();
    const edges: StudioGraphEdge[] = [];

    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    for (const edge of graph.edges) {
        // Out of a decision a wire leaves its case's pin; one without a live case isn't drawn.
        const cases = byId.get(edge.from)?.decision?.cases;
        if (cases && (edge.case === undefined || !cases.includes(edge.case))) continue;
        const sourcePin: PinId = cases && edge.case !== undefined ? getCasePin(edge.case) : "out";
        wired.add(`${edge.from}:${sourcePin}`);
        wired.add(`${edge.to}:in`);
        const isSelected = selection?.type === "edge" && selection.id === edge.id;
        edges.push({
            id: edge.id,
            source: edge.from,
            target: edge.to,
            sourceHandle: sourcePin,
            targetHandle: "in",
            type: "studioEdge",
            className: [
                "bp-edge",
                `bp-edge-${edge.kind}`,
                edge.mandated ? "" : "bp-edge-loose",
                isSelected ? "bp-edge-selected" : "",
            ]
                .filter(Boolean)
                .join(" "),
            data: { edge, isSelected },
        });
    }

    const nodes: StudioGraphNode[] = [];
    for (const node of graph.nodes) {
        const casePins = (node.decision?.cases ?? []).map(getCasePin);
        const pins: PinId[] = node.decision ? ["in", ...casePins] : ["in", "out"];
        const width = BP.width;
        const height = getNodeHeight(node);
        nodes.push({
            id: node.id,
            type: "studioNode",
            position: node.position,
            width,
            height,
            measured: { width, height },
            handles: [
                ...pins.filter((id) => getPinCase(id) === null).map((id) => handle(id)),
                ...casePins.map((id, index) => handle(id, getCasePinTop(index))),
            ],
            data: {
                node,
                isSelected: selectedNode === node.id,
                wired: pins.filter((id) => wired.has(`${node.id}:${id}`)),
            },
        });
    }

    return { nodes, edges };
};
