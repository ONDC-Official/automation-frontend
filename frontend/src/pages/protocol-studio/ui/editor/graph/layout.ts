import { Position, type NodeHandle, type XYPosition } from "@xyflow/react";

import { isBoundary } from "@pages/protocol-studio/ui/editor/graph/flatten";
import { getSelectedNodeIds } from "@pages/protocol-studio/ui/editor/graph/selection";
import { getCasePin, getPinCase } from "@pages/protocol-studio/ui/editor/graph/decision";
import {
    GROUP_IN,
    GROUP_OUT,
    type GraphHighlight,
    type GraphSelection,
    type PinId,
    type StudioGraph,
    type StudioGraphEdge,
    type StudioGraphNode,
    type StudioNode,
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
    /** A collapsed group's body: two lines of description and a stats row. */
    groupBody: 62,
    padding: 8,
    /** Exec pins: their size, and how far they sit in from the node's side. */
    pin: 13,
    pinInset: 9,
    /** Space left between a node and one placed beside it. */
    gap: 72,
} as const;

/** Where the exec pins sit: the middle of the row under the header. */
export const EXEC_PIN_TOP = BP.header + BP.execRow / 2;

export type NodeRowTone = "response" | "repeat" | "error" | "nack" | "meta";

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
    if (node.repeat) {
        const max = node.repeat.max === "unbounded" ? "∞" : `≤ ${node.repeat.max}`;
        const reset = node.repeat.resetOn ? ` ↺ ${node.repeat.resetOn}` : "";
        rows.push(
            node.repeat.until
                ? {
                      key: "repeat",
                      label: "↻ until",
                      value: `exit() · ${max}${reset}`,
                      tone: "repeat",
                  }
                : { key: "repeat", label: "repeat", value: `${max}${reset}`, tone: "repeat" }
        );
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

/** The height of a node as drawn: its rows, a decision's cases, or a group's body. */
export const getNodeHeight = (node: StudioNode) =>
    BP.header +
    BP.execRow +
    (node.decision
        ? node.decision.cases.length * BP.caseRow
        : node.group
          ? BP.groupBody
          : getNodeRows(node).length * BP.row) +
    BP.padding;

/** A group's boundary pseudo-node: a header and the exec row only. */
export const BOUNDARY_HEIGHT = BP.header + BP.execRow + BP.padding;

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

/**
 * Where a group's Entry and Exit pseudo-nodes stand inside it: Entry one
 * column left of the leftmost node, Exit one column right of the rightmost,
 * both level with the topmost node. They are not stored; they follow the nodes.
 */
export const getBoundaryPositions = (graph: StudioGraph): { in: XYPosition; out: XYPosition } => {
    const bounds = getGraphBounds(graph);
    if (!bounds) return { in: { x: 0, y: 0 }, out: { x: (BP.width + BP.gap) * 2, y: 0 } };
    return {
        in: { x: bounds.x - BP.width - BP.gap * 1.5, y: bounds.y },
        out: { x: bounds.x + bounds.width + BP.gap * 1.5, y: bounds.y },
    };
};

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

export interface BuildGraphOptions {
    /** Inside a group: draw its Entry / Exit pseudo-nodes and the wires to them. */
    boundary?: boolean;
    /** The Journeys stage: light a path, dim the rest. */
    highlight?: GraphHighlight;
}

/**
 * React Flow nodes and edges for one level of the graph. Every wire runs
 * exec-out → exec-in; out of a decision, from the pin of the case it is taken on.
 *
 * Nodes carry their size (`measured`) and pins (`handles`) up front: without
 * them React Flow forgets the pin positions whenever a node object is replaced,
 * which is every frame of a drag, and the wires blink until it re-measures.
 */
export const buildGraph = (
    graph: StudioGraph,
    selection: GraphSelection,
    options: BuildGraphOptions = {}
): { nodes: StudioGraphNode[]; edges: StudioGraphEdge[] } => {
    const { boundary, highlight } = options;
    const selectedNodes = new Set(getSelectedNodeIds(selection));
    const wired = new Set<string>();
    const fanOut = new Map<string, number>();
    const edges: StudioGraphEdge[] = [];

    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const known = (id: string) => byId.has(id) || (boundary && isBoundary(id));

    // How many wires leave each pin: ≥2 is a fork of alternatives.
    const perPin = new Map<string, number>();
    for (const edge of graph.edges) {
        const cases = byId.get(edge.from)?.decision?.cases;
        const pin: PinId = cases && edge.case !== undefined ? getCasePin(edge.case) : "out";
        const key = `${edge.from}:${pin}`;
        perPin.set(key, (perPin.get(key) ?? 0) + 1);
        if (pin === "out") fanOut.set(edge.from, (fanOut.get(edge.from) ?? 0) + 1);
    }

    for (const edge of graph.edges) {
        if (!known(edge.from) || !known(edge.to)) continue;
        // Out of a decision a wire leaves its case's pin; one without a live case isn't drawn.
        const cases = byId.get(edge.from)?.decision?.cases;
        if (cases && (edge.case === undefined || !cases.includes(edge.case))) continue;
        const sourcePin: PinId = cases && edge.case !== undefined ? getCasePin(edge.case) : "out";
        wired.add(`${edge.from}:${sourcePin}`);
        wired.add(`${edge.to}:in`);
        const isSelected = selection?.type === "edge" && selection.id === edge.id;
        const isAlternative = !cases && (perPin.get(`${edge.from}:out`) ?? 0) >= 2;
        const lit = highlight ? highlight.edges.has(edge.id) : undefined;
        const pending = highlight?.pendingEdges?.has(edge.id) ?? false;
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
                lit === true ? "bp-edge-lit" : lit === false && !pending ? "bp-edge-dim" : "",
                pending ? "bp-edge-pending" : "",
            ]
                .filter(Boolean)
                .join(" "),
            data: { edge, isSelected, isAlternative, lit, pending },
        });
    }

    const nodes: StudioGraphNode[] = [];
    const place = (node: StudioNode, extra: Partial<StudioGraphNode> = {}) => {
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
            // React Flow's flag too: a drag of a selected node moves the whole selection.
            selected: selectedNodes.has(node.id),
            handles: [
                ...pins.filter((id) => getPinCase(id) === null).map((id) => handle(id)),
                ...casePins.map((id, index) => handle(id, getCasePinTop(index))),
            ],
            data: {
                node,
                isSelected: selectedNodes.has(node.id),
                wired: pins.filter((id) => wired.has(`${node.id}:${id}`)),
                fanOut: fanOut.get(node.id) ?? 0,
                lit: highlight ? highlight.nodes.has(node.id) : undefined,
                ...(highlight?.runStatus?.[node.id]
                    ? { runStatus: highlight.runStatus[node.id] }
                    : {}),
            },
            ...extra,
        });
    };
    for (const node of graph.nodes) place(node);

    if (boundary) {
        const at = getBoundaryPositions(graph);
        const pseudo = (id: string, side: "in" | "out", position: XYPosition) => {
            const pins: PinId[] = side === "in" ? ["out"] : ["in"];
            nodes.push({
                id,
                type: "studioNode",
                position,
                width: BP.width,
                height: BOUNDARY_HEIGHT,
                measured: { width: BP.width, height: BOUNDARY_HEIGHT },
                draggable: false,
                selectable: false,
                handles: pins.map((pin) => handle(pin)),
                data: {
                    node: {
                        id,
                        api: side === "in" ? "Entry" : "Exit",
                        owner: "BAP",
                        kind: "group",
                        responseFor: null,
                        description: "",
                        files: {
                            generate: "",
                            validate: "",
                            match: "",
                            exit: "",
                            requirements: "",
                            defaultPayload: "",
                            inputs: "",
                        },
                        position,
                    },
                    isSelected: false,
                    wired: pins.filter((pin) => wired.has(`${id}:${pin}`)),
                    fanOut: fanOut.get(id) ?? 0,
                    boundary: side,
                },
            });
        };
        pseudo(GROUP_IN, "in", at.in);
        pseudo(GROUP_OUT, "out", at.out);
    }

    return { nodes, edges };
};
