import { useEffect, useRef } from "react";
import { CubeTransparentIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import type { INodesTabProps } from "@pages/protocol-studio/ui/editor/types";

/** The graph as a list: every node, in the order it was added. Clicking one selects it and brings it into view. */
export const NodesTab = ({ graph, selection, onSelectNode, onRemoveNode }: INodesTabProps) => {
    const listRef = useRef<HTMLUListElement>(null);
    const selectedId = selection?.type === "node" ? selection.id : null;

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
                    const isSelected = node.id === selectedId;
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
                                title={`${label}${node.description ? `\n${node.description}` : ""}`}
                            >
                                <span className="bp-tree-kind">
                                    <Icon />
                                </span>
                                <span className="studio-mono truncate">{node.id}</span>
                                {node.decision ? null : (
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
