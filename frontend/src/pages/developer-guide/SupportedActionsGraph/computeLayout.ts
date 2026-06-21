export const isSentinelKey = (k: string) => k === "null" || k === "";

export const NODE_W = 192;
export const NODE_H = 70;
const COL_GAP = 268;
const ROW_GAP = 90;

export function computeLayout(
    allApis: string[],
    actionMap: Record<string, string[]>,
    entryPoints: Set<string>
): Map<string, { x: number; y: number }> {
    // Assign layers via BFS from entry points
    const layer = new Map<string, number>();
    const queue: string[] = [];

    for (const ep of entryPoints) {
        if (allApis.includes(ep)) {
            layer.set(ep, 0);
            queue.push(ep);
        }
    }
    // Fallback: any node with no incoming edges gets layer 0
    if (queue.length === 0) {
        const hasIncoming = new Set<string>();
        for (const api of allApis) {
            for (const next of actionMap[api] ?? []) {
                hasIncoming.add(next);
            }
        }
        for (const api of allApis) {
            if (!hasIncoming.has(api)) {
                layer.set(api, 0);
                queue.push(api);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const node = queue[head++];
        const nodeLayer = layer.get(node) ?? 0;
        for (const next of actionMap[node] ?? []) {
            if (!layer.has(next)) {
                layer.set(next, nodeLayer + 1);
                queue.push(next);
            } else if ((layer.get(next) ?? 0) < nodeLayer + 1) {
                layer.set(next, nodeLayer + 1);
            }
        }
    }

    // Assign remaining nodes a layer
    for (const api of allApis) {
        if (!layer.has(api)) layer.set(api, 0);
    }

    // Group nodes by layer, sort within each layer (entry first, then alpha)
    const byLayer = new Map<number, string[]>();
    for (const api of allApis) {
        const l = layer.get(api) ?? 0;
        const arr = byLayer.get(l) ?? [];
        arr.push(api);
        byLayer.set(l, arr);
    }
    for (const [, arr] of byLayer) {
        arr.sort((a, b) => {
            const aE = entryPoints.has(a) ? -1 : 0;
            const bE = entryPoints.has(b) ? -1 : 0;
            if (aE !== bE) return aE - bE;
            return a.localeCompare(b);
        });
    }

    const positions = new Map<string, { x: number; y: number }>();
    for (const [col, nodes] of byLayer) {
        const totalH = nodes.length * (NODE_H + ROW_GAP) - ROW_GAP;
        const startY = -totalH / 2;
        nodes.forEach((api, row) => {
            positions.set(api, {
                x: col * (NODE_W + COL_GAP),
                y: startY + row * (NODE_H + ROW_GAP),
            });
        });
    }
    return positions;
}
