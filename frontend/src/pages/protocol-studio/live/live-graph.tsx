import { useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import "@pages/protocol-studio/ui/editor/studio-editor.css";
import { EditorCanvas } from "@pages/protocol-studio/ui/editor/editor-canvas";
import { buildGraph } from "@pages/protocol-studio/ui/editor/graph/layout";
import type { WalkResult } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type {
    FlatGraph,
    GraphHighlight,
    RunStatus,
    StudioGraph,
} from "@pages/protocol-studio/ui/editor/types";

const noop = () => undefined;
const rawEdgeIds = (flatEdgeId: string) => flatEdgeId.split(">");

export interface ILiveGraphProps {
    root: StudioGraph;
    flat: FlatGraph;
    walk: WalkResult;
    /** The run's node statuses, once the journey started. */
    runStatus?: Record<string, RunStatus>;
}

/**
 * The protocol graph, read-only, with the journey's path lit and each node
 * ringed by its run status: the "Graph" view of a live journey card.
 */
export const LiveGraph = ({ root, flat, walk, runStatus }: ILiveGraphProps) => {
    const highlight = useMemo<GraphHighlight>(() => {
        const nodes = new Set<string>();
        for (const id of walk.nodeIds) {
            nodes.add(id);
            // A collapsed group lights up when its children are on the path.
            let group = flat.groupOf.get(id);
            while (group) {
                nodes.add(group);
                group = flat.groupOf.get(group);
            }
        }
        const edges = new Set<string>();
        for (const id of walk.edgeIds) rawEdgeIds(id).forEach((raw) => edges.add(raw));
        return { nodes, edges, runStatus };
    }, [walk, flat, runStatus]);
    const rfGraph = useMemo(() => buildGraph(root, null, { highlight }), [root, highlight]);

    return (
        <div className="studio-editor studio-live-graph">
            <ReactFlowProvider>
                <EditorCanvas
                    nodes={rfGraph.nodes}
                    edges={rfGraph.edges}
                    onNodesChange={noop}
                    onNodeClick={noop}
                    onNodeDragStart={noop}
                    onNodeContextMenu={noop}
                    onEdgeClick={noop}
                    onEdgeContextMenu={noop}
                    onPaneClick={noop}
                    onPaneContextMenu={noop}
                    onConnect={noop}
                    onConnectEnd={noop}
                    isValidConnection={() => false}
                    isEmpty={root.nodes.length === 0}
                    onTidy={noop}
                    readOnly
                />
            </ReactFlowProvider>
        </div>
    );
};
