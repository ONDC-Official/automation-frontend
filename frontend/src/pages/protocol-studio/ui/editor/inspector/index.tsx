import { useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
    AdjustmentsHorizontalIcon,
    ViewColumnsIcon,
    WindowIcon,
} from "@heroicons/react/24/outline";

import { getTemplateFiles } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { EDGE_KINDS, NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import {
    DECISION_TABS,
    getInspectorTabs,
    INSPECTOR_GROUPS,
    splitFileName,
} from "@pages/protocol-studio/ui/editor/inspector/constants";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { DecisionProperties } from "@pages/protocol-studio/ui/editor/inspector/decision-properties";
import { EdgeProperties } from "@pages/protocol-studio/ui/editor/inspector/edge-properties";
import { NodeProperties } from "@pages/protocol-studio/ui/editor/inspector/node-properties";
import type {
    IInspectorCardProps,
    IInspectorCodePaneProps,
    InspectorTabId,
    NodeFileId,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * The step function each code tab holds, as the compiler names it. `decide`
 * has none: the lib doesn't compile it yet, so it is type-checked only.
 */
const COMPILE_AS: Partial<Record<NodeFileId, IInspectorCodePaneProps["compileAs"]>> = {
    generate: "generate",
    validate: "validate",
    requirements: "meetsRequirements",
};

/**
 * Full-height card on the right. A selected node shows its properties (as a
 * form) and its files; a selected wire shows its own form. With nothing
 * selected the file tabs preview the lib's step templates. Edits are held in
 * memory only. Config-level files (helpers.ts, the raw config) open from the
 * header instead.
 */
export const InspectorCard = ({
    isMaximized,
    onToggleMaximized,
    resizeHandleProps,
    graph,
    selection,
    activeTab,
    onTabChange,
    actions,
    reveal,
    helperNames,
}: IInspectorCardProps) => {
    const [templates, setTemplates] = useState(() => getTemplateFiles());
    const node =
        selection?.type === "node" ? graph.nodes.find((n) => n.id === selection.id) : undefined;
    const edge =
        selection?.type === "edge" ? graph.edges.find((e) => e.id === selection.id) : undefined;
    const decision = node?.decision;
    const tabs = decision ? DECISION_TABS : getInspectorTabs(node?.codeLanguage ?? "typescript");
    const tab = tabs.find(({ id }) => id === activeTab) ?? tabs[0];
    const showProperties = activeTab === "properties";

    const valueOf = (id: NodeFileId) => {
        if (id === "decide") return decision?.decide ?? "";
        return node ? node.files[id] : templates[id];
    };

    const change = (id: NodeFileId, value: string) => {
        if (id === "decide") {
            if (node && decision)
                actions.updateNode(node.id, { decision: { ...decision, decide: value } });
        } else if (node) actions.updateNodeFile(node.id, id, value);
        else setTemplates((prev) => ({ ...prev, [id]: value }));
    };

    // One Monaco model per node file, so each keeps its own undo history. Ids
    // like `GENERATED#1#search` are legal, so the id is escaped for the URI.
    const owner = encodeURIComponent(node?.id ?? "templates");

    let summary;
    if (node) {
        summary = (
            <p
                className="studio-text-dim truncate text-[12px]"
                title={node.description || undefined}
            >
                <span className="studio-mono studio-text">{node.id}</span> ·{" "}
                {NODE_KINDS[node.kind].label} ·{" "}
                {decision ? (decision.mode === "input" ? "user input" : "session") : node.owner}
            </p>
        );
    } else if (edge) {
        summary = (
            <p className="studio-text-dim truncate text-[12px]">
                <span className="studio-mono studio-text">
                    {edge.from} → {edge.to}
                </span>{" "}
                · {EDGE_KINDS[edge.kind].label} wire
            </p>
        );
    } else {
        summary = (
            <p className="studio-text-dim truncate text-[12px]">
                No node selected · step templates
            </p>
        );
    }

    return (
        <section
            className="studio-glass studio-inspector flex flex-col"
            aria-label="Inspector"
            data-maximized={isMaximized || undefined}
        >
            {isMaximized ? null : (
                <div
                    className="studio-handle studio-handle-x"
                    aria-label="Resize inspector"
                    title="Drag to resize · double-click to reset"
                    {...resizeHandleProps}
                />
            )}

            <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                <div className="min-w-0 flex-1">
                    <p className="studio-eyebrow">Inspector</p>
                    {summary}
                </div>
                <span className="studio-badge">
                    {node || edge ? "in memory" : "preview"} · not saved
                </span>
                <button
                    type="button"
                    className="studio-key studio-key-icon"
                    onClick={onToggleMaximized}
                    aria-pressed={isMaximized}
                    aria-label={isMaximized ? "Restore inspector" : "Maximize inspector"}
                    title={isMaximized ? "Restore (Esc)" : "Maximize"}
                >
                    {isMaximized ? <ViewColumnsIcon /> : <WindowIcon />}
                </button>
            </header>

            {edge ? (
                <div className="studio-well bp-props-well m-3 mt-1 min-h-0 flex-1">
                    <EdgeProperties
                        key={edge.id}
                        edge={edge}
                        nodes={graph.nodes}
                        edges={graph.edges}
                        actions={actions}
                    />
                </div>
            ) : (
                <TabsPrimitive.Root
                    value={showProperties ? "properties" : tab.id}
                    onValueChange={(value) => onTabChange(value as InspectorTabId)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <TabsPrimitive.List className="studio-filepicker" aria-label="Inspector files">
                        <div className="studio-filerow" data-group="node">
                            <TabsPrimitive.Trigger
                                value="properties"
                                className="studio-file"
                                title={
                                    decision
                                        ? "The decision's fields: mode, cases, input"
                                        : "The node's own fields: kind, owner, guard, effects, …"
                                }
                            >
                                <AdjustmentsHorizontalIcon />
                                <span className="studio-file-name">Properties</span>
                            </TabsPrimitive.Trigger>
                        </div>
                        {INSPECTOR_GROUPS.filter((group) =>
                            tabs.some((t) => t.group === group.id)
                        ).map((group) => (
                            <div key={group.id} className="studio-filerow" data-group={group.id}>
                                {tabs
                                    .filter((t) => t.group === group.id)
                                    .map((t) => {
                                        const { base, ext } = splitFileName(t.label);
                                        return (
                                            <TabsPrimitive.Trigger
                                                key={t.id}
                                                value={t.id}
                                                className="studio-file"
                                                title={`${group.label} › ${t.label}\n${t.description}`}
                                            >
                                                <t.Icon />
                                                <span className="studio-file-name">
                                                    {base}
                                                    <span className="studio-file-ext">{ext}</span>
                                                </span>
                                            </TabsPrimitive.Trigger>
                                        );
                                    })}
                            </div>
                        ))}
                    </TabsPrimitive.List>

                    {showProperties ? (
                        <TabsPrimitive.Content
                            value="properties"
                            className="studio-well bp-props-well m-3 mt-2 min-h-0 flex-1 outline-none"
                        >
                            {node && node.decision ? (
                                <DecisionProperties
                                    key={node.id}
                                    node={{ ...node, decision: node.decision }}
                                    edges={graph.edges}
                                    actions={actions}
                                    onEditCode={() => onTabChange("decide")}
                                />
                            ) : node ? (
                                <NodeProperties
                                    key={node.id}
                                    node={node}
                                    nodes={graph.nodes}
                                    actions={actions}
                                />
                            ) : (
                                <p className="bp-props-empty">
                                    Select a node to edit its properties, or right-click the canvas
                                    to add one.
                                </p>
                            )}
                        </TabsPrimitive.Content>
                    ) : (
                        <TabsPrimitive.Content
                            value={tab.id}
                            className="studio-well m-3 mt-2 min-h-0 flex-1 outline-none"
                        >
                            <InspectorCodePane
                                path={`studio://${owner}/${tab.label}`}
                                language={tab.language}
                                value={valueOf(tab.id)}
                                onChange={(value) => change(tab.id, value)}
                                reveal={reveal?.tab === tab.id ? reveal : null}
                                compileAs={COMPILE_AS[tab.id]}
                                helperNames={helperNames}
                            />
                        </TabsPrimitive.Content>
                    )}
                </TabsPrimitive.Root>
            )}
        </section>
    );
};

export default InspectorCard;
