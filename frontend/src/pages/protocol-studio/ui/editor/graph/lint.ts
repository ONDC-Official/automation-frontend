import {
    forEachLevel,
    getEntryNodes,
    hasMainWireInto,
    isBoundary,
} from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    GROUP_IN,
    GROUP_OUT,
    type FlatGraph,
    type ProtocolProblem,
    type StudioGraph,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * Checks the protocol graph. Pure: the console's Problems tab shows the
 * result and the header's Protocol pill counts it. Errors are things a run
 * could not follow; warnings are things a reader would stumble on.
 */
export const lintProtocol = (root: StudioGraph, flat: FlatGraph): ProtocolProblem[] => {
    const problems: ProtocolProblem[] = [];
    const add = (problem: Omit<ProtocolProblem, "id">) =>
        problems.push({
            id: `${problem.level}:${problem.nodeId ?? ""}:${problem.edgeId ?? ""}:${problems.length}`,
            ...problem,
        });

    forEachLevel(root, (graph, groupId) => {
        for (const node of graph.nodes) {
            if (node.decision) {
                const wired = new Set(
                    graph.edges.filter((e) => e.from === node.id).map((e) => e.case)
                );
                for (const value of node.decision.cases) {
                    if (!wired.has(value)) {
                        add({
                            level: "error",
                            message: `Decision ${node.id}: case “${value}” has no wire — a run returning it has nowhere to go`,
                            nodeId: node.id,
                        });
                    }
                }
                if (!graph.edges.some((e) => e.to === node.id)) {
                    add({
                        level: "warning",
                        message: `Decision ${node.id} has nothing wired into it`,
                        nodeId: node.id,
                    });
                }
                continue;
            }
            if (node.group) {
                const { name, description, graph: inner } = node.group;
                if (!name.trim() || !description.trim()) {
                    add({
                        level: "warning",
                        message: `Group ${node.id} needs a name and a description, so a reader knows what it covers`,
                        nodeId: node.id,
                    });
                }
                if (inner.nodes.length === 0) {
                    add({
                        level: "info",
                        message: `Group ${name || node.id} is empty`,
                        nodeId: node.id,
                    });
                } else {
                    if (!inner.edges.some((e) => e.from === GROUP_IN)) {
                        add({
                            level: "warning",
                            message: `Group ${name || node.id}: nothing is wired from its Entry — a run cannot get in`,
                            nodeId: node.id,
                        });
                    }
                    if (!inner.edges.some((e) => e.to === GROUP_OUT)) {
                        add({
                            level: "info",
                            message: `Group ${name || node.id}: nothing is wired to its Exit — the protocol ends inside`,
                            nodeId: node.id,
                        });
                    }
                }
                continue;
            }
            if (node.kind === "callback" && node.responseFor === null) {
                add({
                    level: "warning",
                    message: `${node.id} is a callback but answers no request (responseFor is empty)`,
                    nodeId: node.id,
                });
            }
        }

        // Alternatives: several wires out of one API pin. Each needs a name.
        const byPin = new Map<string, typeof graph.edges>();
        for (const edge of graph.edges) {
            if (isBoundary(edge.from)) continue;
            const source = graph.nodes.find((n) => n.id === edge.from);
            if (!source || source.decision) continue;
            const list = byPin.get(edge.from) ?? [];
            list.push(edge);
            byPin.set(edge.from, list);
        }
        for (const [from, wires] of byPin) {
            if (wires.length < 2) continue;
            const targets = wires.map(
                (e) => flat.byId.get(e.to) ?? graph.nodes.find((n) => n.id === e.to)
            );
            const owners = new Set(targets.map((t) => t?.owner).filter(Boolean));
            if (owners.size > 1) {
                add({
                    level: "info",
                    message: `${from} forks to steps owned by both BAP and BPP — either side may act next`,
                    nodeId: from,
                });
            }
            for (const edge of wires) {
                if (!edge.label?.trim()) {
                    add({
                        level: "warning",
                        message: `${from} → ${edge.to} is one of ${wires.length} alternatives but has no label — journeys are named from it`,
                        edgeId: edge.id,
                        nodeId: from,
                    });
                }
            }
        }
        void groupId;
    });

    // Start / End marks and repeat-until, across levels.
    const unmarkedRoots = new Set<string>();
    const anyStart = flat.nodes.some((node) => node.start && node.kind !== "on_demand");
    for (const node of flat.nodes) {
        if (node.start && hasMainWireInto(flat, node)) {
            add({
                level: "error",
                message: `${node.id} is marked Start but a wire leads into it — only a node nothing wires into can start a journey (unmark it, or remove the wire)`,
                nodeId: node.id,
            });
        } else if (node.start && node.kind === "on_demand") {
            add({
                level: "info",
                message: `${node.id} is on-demand: its Start mark is ignored`,
                nodeId: node.id,
            });
        }
        if (anyStart && !node.start && node.kind !== "on_demand" && !hasMainWireInto(flat, node)) {
            unmarkedRoots.add(node.id);
            add({
                level: "warning",
                message: `${node.id}: nothing wires into it and it isn't marked Start, so no run reaches it`,
                nodeId: node.id,
            });
        }
        if (node.repeat?.until) {
            if (node.kind === "on_demand" || node.kind === "form") {
                add({
                    level: "info",
                    message: `${node.id} repeats until exit(), but ${node.kind === "form" ? "a form" : "an on-demand node"} never evaluates it`,
                    nodeId: node.id,
                });
            } else if (!(node.files.exit ?? "").trim()) {
                add({
                    level: "error",
                    message: `${node.id} repeats until exit(), but exit.ts is empty — write the condition that stops it`,
                    nodeId: node.id,
                });
            }
        }
    }

    // Reachability from the entries, across levels. On-demand nodes can be
    // fired from anywhere, so they and what follows them count as reached.
    const entries = getEntryNodes(flat);
    if (flat.nodes.some((node) => node.kind !== "on_demand") && entries.length === 0) {
        add({
            level: "warning",
            message: "Every node has a wire into it: there is no entry a run can start from",
        });
    }
    const reached = new Set<string>();
    const queue = [
        ...entries.map((node) => node.id),
        ...flat.nodes.filter((node) => node.kind === "on_demand").map((node) => node.id),
    ];
    while (queue.length > 0) {
        const id = queue.shift() as string;
        if (reached.has(id)) continue;
        reached.add(id);
        for (const edge of flat.out.get(id) ?? []) queue.push(edge.to);
    }
    for (const node of flat.nodes) {
        if (!reached.has(node.id) && !unmarkedRoots.has(node.id)) {
            add({
                level: "info",
                message: `${node.id} cannot be reached from any entry`,
                nodeId: node.id,
            });
        }
    }

    return problems;
};

/** Problem counts by level, for the stage pills. */
export const countProblems = (problems: ProtocolProblem[]) => ({
    errors: problems.filter((p) => p.level === "error").length,
    warnings: problems.filter((p) => p.level === "warning").length,
});
