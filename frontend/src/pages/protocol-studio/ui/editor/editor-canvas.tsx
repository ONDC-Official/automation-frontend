import { memo } from "react";
import {
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    ChevronRightIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
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
import { formatShortcut, isMac } from "@pages/protocol-studio/ui/editor/shortcuts";
import type { IEditorCanvasProps } from "@pages/protocol-studio/ui/editor/types";

const PRO_OPTIONS = { hideAttribution: true };
/** ⇧-click or ⌘-click (Ctrl elsewhere) adds a node to the selection, or takes it out. */
const MULTI_SELECT_KEYS = isMac ? ["Meta", "Shift"] : ["Control", "Shift"];

/**
 * Full-bleed graph canvas the glass panels float over. Nodes drag freely, wires
 * drag between their exec pins, and right-click opens the graph menu. Inside a
 * group a breadcrumb floats at the top; in the Journeys stage the canvas is
 * read-only and only lights the journey's path.
 */
const EditorCanvasBase = ({
    nodes,
    edges,
    onNodesChange,
    onNodeClick,
    onNodeDoubleClick,
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
    history,
    readOnly,
    breadcrumb,
    emptyHint,
}: IEditorCanvasProps) => {
    const theme = useAppliedTheme();

    return (
        <div className="studio-canvas absolute inset-0" data-readonly={readOnly || undefined}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
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
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                // The editor owns the selection: React Flow only reports clicks,
                // ⇧-drag boxes and ⌘-clicks through onNodesChange's `select`
                // changes, and the nodes come back with `selected` set from it.
                elementsSelectable
                selectionKeyCode={readOnly ? null : "Shift"}
                multiSelectionKeyCode={readOnly ? null : MULTI_SELECT_KEYS}
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
                    {readOnly || !history ? null : (
                        <>
                            <ControlButton
                                className="studio-control-icon"
                                onClick={history.undo}
                                disabled={!history.canUndo}
                                title={`Undo (${formatShortcut("Z")})`}
                                aria-label="Undo"
                            >
                                <ArrowUturnLeftIcon />
                            </ControlButton>
                            <ControlButton
                                className="studio-control-icon"
                                onClick={history.redo}
                                disabled={!history.canRedo}
                                title={`Redo (${formatShortcut("Z", { shift: true })})`}
                                aria-label="Redo"
                            >
                                <ArrowUturnRightIcon />
                            </ControlButton>
                        </>
                    )}
                    {readOnly ? null : (
                        <ControlButton
                            className="studio-tidy"
                            onClick={onTidy}
                            disabled={isEmpty}
                            title="Tidy up: arrange the nodes in columns along their wires"
                            aria-label="Tidy up layout"
                        >
                            <Squares2X2Icon />
                        </ControlButton>
                    )}
                </Controls>
            </ReactFlow>

            <div className="studio-vignette" aria-hidden="true" />

            {/* The visible canvas area: between the explorer, the inspector and the dock. */}
            <div className="studio-canvas-area" aria-hidden="true">
                {breadcrumb && breadcrumb.length > 1 ? (
                    <nav className="studio-glass studio-breadcrumb" aria-label="Where you are">
                        {breadcrumb.map((crumb, index) => {
                            const isLast = index === breadcrumb.length - 1;
                            return (
                                <span key={index} className="studio-breadcrumb-step">
                                    {index > 0 ? <ChevronRightIcon aria-hidden="true" /> : null}
                                    <button
                                        type="button"
                                        className="studio-breadcrumb-link"
                                        data-current={isLast || undefined}
                                        disabled={isLast}
                                        onClick={crumb.onSelect}
                                        style={{ pointerEvents: "auto" }}
                                    >
                                        {crumb.label}
                                    </button>
                                </span>
                            );
                        })}
                    </nav>
                ) : null}
                {isEmpty ? (
                    <div className="studio-empty-hint">
                        <p className="studio-empty-hint-title">
                            {emptyHint?.title ?? "Empty graph"}
                        </p>
                        <p className="studio-empty-hint-sub">
                            {emptyHint?.sub ?? "Right-click anywhere to add a node"}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const EditorCanvas = memo(EditorCanvasBase);

export default EditorCanvas;
