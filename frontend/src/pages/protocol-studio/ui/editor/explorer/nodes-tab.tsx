import { useEffect, useRef } from "react";
import { CubeTransparentIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { getSelectedNodeIds } from "@pages/protocol-studio/ui/editor/graph/selection";
import type { INodesTabProps } from "@pages/protocol-studio/ui/editor/types";

/** The graph as a list: every node, in the order it was added. Clicking one selects it and brings it into view. */
export const NodesTab = ({
    graph,
    selection,
    onSelectNode,
    onRemoveNode,
    onEnterGroup,
}: INodesTabProps) => {
    const listRef = useRef<HTMLUListElement>(null);
    // The row scrolled into view: a single selection's node.
    const selectedId = selection?.type === "node" ? selection.id : null;
    const selectedIds = new Set(getSelectedNodeIds(selection));

    useEffect(() => {
        if (!selectedId) return;
        listRef.current
            ?.querySelector(`[data-node-row="${CSS.escape(selectedId)}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [selectedId]);

    if (graph.nodes.length === 0) {
        return (
            <div className="studio-explorer-empty">
                <CubeTransparentIcon className="studio-explorer-empty-icon" />
                <p className="studio-empty-hint-title">No nodes yet</p>
                <p className="studio-empty-hint-sub">Right-click the canvas to add one.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="studio-explorer-toolbar">
                <span className="studio-eyebrow">On the graph</span>
                <span className="studio-text-faint ml-auto text-[11px]">
                    {graph.nodes.length} {graph.nodes.length === 1 ? "node" : "nodes"} ·{" "}
                    {graph.edges.length} {graph.edges.length === 1 ? "wire" : "wires"}
                </span>
            </div>

            <ul ref={listRef} className="studio-tree" aria-label="Nodes">
                {graph.nodes.map((node) => {
                    const isSelected = selectedIds.has(node.id);
                    const { Icon, label } = NODE_KINDS[node.kind];
                    return (
                        <li key={node.id} className="bp-tree-item">
                            <button
                                type="button"
                                className="studio-tree-action bp-tree-row"
                                data-node-row={node.id}
                                data-kind={node.kind}
                                data-selected={isSelected || undefined}
                                aria-current={isSelected || undefined}
                                onClick={() => onSelectNode(node.id)}
                                onDoubleClick={() => node.group && onEnterGroup?.(node.id)}
                                title={`${node.group ? `${node.group.name} · double-click to open` : label}${node.description ? `\n${node.description}` : ""}`}
                            >
                                <span className="bp-tree-kind">
                                    <Icon />
                                </span>
                                <span className="studio-mono truncate">
                                    {node.group ? node.group.name || node.id : node.id}
                                </span>
                                {node.decision ? (
                                    <span className="studio-badge ml-auto">decision</span>
                                ) : node.group ? (
                                    <span className="studio-badge ml-auto">
                                        {node.group.graph.nodes.length} inside
                                    </span>
                                ) : (
                                    <span className="studio-owner ml-auto" data-owner={node.owner}>
                                        {node.owner}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                className="studio-tree-remove bp-tree-remove"
                                onClick={() => onRemoveNode(node.id)}
                                aria-label={`Delete ${node.id}`}
                                title="Delete node"
                            >
                                <XMarkIcon />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default NodesTab;
