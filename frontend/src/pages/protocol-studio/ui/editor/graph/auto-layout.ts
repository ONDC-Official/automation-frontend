import type { XYPosition } from "@xyflow/react";

import { BP, getNodeHeight } from "@pages/protocol-studio/ui/editor/graph/layout";
import type { StudioGraph, StudioNode } from "@pages/protocol-studio/ui/editor/types";

/** Space between columns, between nodes in a column, and between separate journeys. */
const COLUMN_GAP = 96;
const ROW_GAP = 40;
const GROUP_GAP = 96;
/** A long journey wraps onto a new row of columns after this many, so it stays readable. */
const COLUMNS_PER_ROW = 3;
/** Unwired nodes are laid out in rows this many wide, under everything else. */
const LOOSE_PER_ROW = COLUMNS_PER_ROW;

/**
 * Tidies the graph into columns, left to right along the wires, like a
 * layered (Sugiyama-style) layout kept deliberately small:
 *
 * 1. Wires that loop back (a cycle) are set aside, so the rest flows one way.
 * 2. A node's column is the longest wire path into it, so a step always sits
 *    to the right of everything that leads to it.
 * 3. Within a column, a node lines up with the nodes wired into it, and is
 *    pushed down only as far as it must be to clear the one above.
 * 4. A journey longer than `COLUMNS_PER_ROW` wraps, like text, onto a new row
 *    of columns below.
 * 5. Separate journeys stack top to bottom; unwired nodes go in rows below.
 *
 * The result starts at the graph's current top-left, so it stays roughly where
 * it was. Returns every node's new position.
 */
export const tidyLayout = (graph: StudioGraph): Map<string, XYPosition> => {
    const positions = new Map<string, XYPosition>();
    const boxes = graph.nodes;
    if (boxes.length === 0) return positions;

    const heightOf = (node: StudioNode) => getNodeHeight(node);

    // Reading order (left to right, then top to bottom) keeps every tie stable.
    const order = [...boxes].sort(
        (a, b) => a.position.x - b.position.x || a.position.y - b.position.y
    );
    const rankInOrder = new Map(order.map((node, index) => [node.id, index]));

    const out = new Map<string, string[]>(order.map((node) => [node.id, []]));
    const into = new Map<string, string[]>(order.map((node) => [node.id, []]));
    const seen = new Set<string>();
    for (const edge of graph.edges) {
        const { from, to } = edge;
        const key = `${from}→${to}`;
        if (from === to || seen.has(key) || !out.has(from) || !out.has(to)) continue;
        seen.add(key);
        out.get(from)?.push(to);
        into.get(to)?.push(from);
    }

    // Depth-first from the roots: a wire back into the current path closes a
    // cycle and is skipped. Reverse post-order is then a topological order.
    const state = new Map<string, "open" | "done">();
    const loops = new Set<string>();
    const postOrder: string[] = [];
    const visit = (root: string) => {
        const stack: [string, number][] = [[root, 0]];
        state.set(root, "open");
        while (stack.length > 0) {
            const top = stack[stack.length - 1];
            const [id, next] = top;
            const targets = out.get(id) ?? [];
            if (next < targets.length) {
                top[1] += 1;
                const to = targets[next];
                if (state.get(to) === "open") loops.add(`${id}→${to}`);
                else if (!state.has(to)) {
                    state.set(to, "open");
                    stack.push([to, 0]);
                }
            } else {
                state.set(id, "done");
                postOrder.push(id);
                stack.pop();
            }
        }
    };
    for (const node of order) if ((into.get(node.id) ?? []).length === 0) visit(node.id);
    for (const node of order) if (!state.has(node.id)) visit(node.id);

    const preds = (id: string) =>
        (into.get(id) ?? []).filter((from) => !loops.has(`${from}→${id}`));
    const topological = postOrder.reverse();
    const column = new Map<string, number>();
    for (const id of topological) {
        column.set(id, Math.max(0, ...preds(id).map((from) => (column.get(from) ?? 0) + 1)));
    }

    // Journeys: nodes joined by wires, either way round.
    const group = new Map<string, number>();
    const groups: string[][] = [];
    for (const node of order) {
        if (group.has(node.id)) continue;
        const members: string[] = [];
        const queue = [node.id];
        group.set(node.id, groups.length);
        while (queue.length > 0) {
            const id = queue.shift() as string;
            members.push(id);
            for (const next of [...(out.get(id) ?? []), ...(into.get(id) ?? [])]) {
                if (group.has(next)) continue;
                group.set(next, groups.length);
                queue.push(next);
            }
        }
        groups.push(members);
    }

    const byId = new Map(boxes.map((node) => [node.id, node]));
    const origin = {
        x: Math.min(...boxes.map((node) => node.position.x)),
        y: Math.min(...boxes.map((node) => node.position.y)),
    };
    const place = (node: StudioNode, x: number, y: number) => {
        positions.set(node.id, { x, y });
        return BP.width;
    };

    let groupTop = origin.y;
    const loose: StudioNode[] = [];
    for (const members of groups) {
        if (members.length === 1) {
            loose.push(byId.get(members[0]) as StudioNode);
            continue;
        }
        const columns: string[][] = [];
        for (const id of members) (columns[column.get(id) ?? 0] ??= []).push(id);

        // Each wrapped row is laid out on its own: `top` is within its row.
        const rowOf = (id: string) => Math.floor((column.get(id) ?? 0) / COLUMNS_PER_ROW);
        const top = new Map<string, number>();
        const rowBottom: number[] = [];
        for (const ids of columns) {
            if (!ids) continue;
            const row = rowOf(ids[0]);
            // Line up with what wires in from the same row: the average top of those nodes.
            const wanted = new Map(
                ids.map((id) => {
                    const from = preds(id).filter((p) => top.has(p) && rowOf(p) === row);
                    const mean =
                        from.length > 0
                            ? from.reduce((sum, p) => sum + (top.get(p) ?? 0), 0) / from.length
                            : null;
                    return [id, mean] as const;
                })
            );
            ids.sort(
                (a, b) =>
                    (wanted.get(a) ?? Infinity) - (wanted.get(b) ?? Infinity) ||
                    (rankInOrder.get(a) ?? 0) - (rankInOrder.get(b) ?? 0)
            );
            let cursor = 0;
            for (const id of ids) {
                const y = Math.max(wanted.get(id) ?? cursor, cursor);
                top.set(id, y);
                cursor = y + heightOf(byId.get(id) as StudioNode) + ROW_GAP;
                rowBottom[row] = Math.max(rowBottom[row] ?? 0, cursor - ROW_GAP);
            }
        }

        // Where each wrapped row starts, under the one before it.
        const rowTop: number[] = [];
        let next = 0;
        for (let row = 0; row < rowBottom.length; row += 1) {
            rowTop[row] = next;
            next += (rowBottom[row] ?? 0) + GROUP_GAP;
        }

        // Every node is as wide; x restarts on every wrapped row.
        const columnLeft: number[] = [];
        let left = 0;
        for (let index = 0; index < columns.length; index += 1) {
            if (index % COLUMNS_PER_ROW === 0) left = 0;
            columnLeft[index] = left;
            left += BP.width + COLUMN_GAP;
        }

        for (const id of members) {
            place(
                byId.get(id) as StudioNode,
                origin.x + (columnLeft[column.get(id) ?? 0] ?? 0),
                groupTop + (rowTop[rowOf(id)] ?? 0) + (top.get(id) ?? 0)
            );
        }
        groupTop += next;
    }

    // Unwired nodes, in rows.
    for (let start = 0; start < loose.length; start += LOOSE_PER_ROW) {
        const row = loose.slice(start, start + LOOSE_PER_ROW);
        let left = origin.x;
        for (const node of row) left += place(node, left, groupTop) + COLUMN_GAP;
        groupTop += Math.max(...row.map(heightOf)) + ROW_GAP;
    }

    return positions;
};
