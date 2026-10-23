import { memo } from "react";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import {
    Background,
    BackgroundVariant,
    ConnectionLineType,
    ControlButton,
    Controls,
    ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useAppliedTheme } from "@/theme/hooks/useAppliedTheme";
import { GRID } from "@pages/protocol-studio/ui/editor/constants";
import { EDGE_TYPES } from "@pages/protocol-studio/ui/editor/graph/edges";
import { NODE_TYPES } from "@pages/protocol-studio/ui/editor/graph/nodes";
import type { IEditorCanvasProps } from "@pages/protocol-studio/ui/editor/types";

const PRO_OPTIONS = { hideAttribution: true };

/**
 * Full-bleed graph canvas the glass panels float over. Nodes drag freely, wires
 * drag between their exec pins, and right-click opens the graph menu.
 */
const EditorCanvasBase = ({
    nodes,
    edges,
    onNodesChange,
    onNodeClick,
    onNodeDragStart,
    onNodeContextMenu,
    onEdgeClick,
    onEdgeContextMenu,
    onPaneClick,
    onPaneContextMenu,
    onConnect,
    onConnectEnd,
    isValidConnection,
    isEmpty,
    onTidy,
}: IEditorCanvasProps) => {
    const theme = useAppliedTheme();

    return (
        <div className="studio-canvas absolute inset-0">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onNodeDragStart={onNodeDragStart}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeClick={onEdgeClick}
                onEdgeContextMenu={onEdgeContextMenu}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                isValidConnection={isValidConnection}
                connectionLineType={ConnectionLineType.Bezier}
                connectionLineStyle={{ strokeWidth: 2.5 }}
                colorMode={theme}
                minZoom={0.2}
                maxZoom={2}
                // Selection is the editor's own (one node or edge), not React Flow's.
                elementsSelectable={false}
                // Deleting goes through the editor's own shortcut, which skips
                // panels: Backspace in a code editor must never remove a node.
                deleteKeyCode={null}
                proOptions={PRO_OPTIONS}
                aria-label="Protocol graph"
            >
                <Background
                    id="studio-grid-minor"
                    variant={BackgroundVariant.Lines}
                    gap={GRID.minor.gap}
                    color={GRID.minor.color}
                    lineWidth={1}
                />
                <Background
                    id="studio-grid-major"
                    variant={BackgroundVariant.Lines}
                    gap={GRID.major.gap}
                    color={GRID.major.color}
                    lineWidth={1}
                />
                <Controls position="top-left" showInteractive={false}>
                    <ControlButton
                        className="studio-tidy"
                        onClick={onTidy}
                        disabled={isEmpty}
                        title="Tidy up: arrange the nodes in columns along their wires"
                        aria-label="Tidy up layout"
                    >
                        <Squares2X2Icon />
                    </ControlButton>
                </Controls>
            </ReactFlow>

            <div className="studio-vignette" aria-hidden="true" />

            {/* The visible canvas area: between the explorer, the inspector and the dock. */}
            <div className="studio-canvas-area" aria-hidden="true">
                {isEmpty ? (
                    <div className="studio-empty-hint">
                        <p className="studio-empty-hint-title">Empty graph</p>
                        <p className="studio-empty-hint-sub">Right-click anywhere to add a node</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const EditorCanvas = memo(EditorCanvasBase);

export default EditorCanvas;
