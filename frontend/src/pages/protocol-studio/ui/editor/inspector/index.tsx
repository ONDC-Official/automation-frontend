import { useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { ViewColumnsIcon, WindowIcon } from "@heroicons/react/24/outline";

import { getTemplateFiles } from "@pages/protocol-studio/ui/editor/flows/action-files";
import { EDGE_KINDS, NODE_KINDS } from "@pages/protocol-studio/ui/editor/graph/catalog";
import { hasMainWireIntoLevel } from "@pages/protocol-studio/ui/editor/graph/flatten";
import {
    firstTabOf,
    getInspectorTabs,
    NODE_SECTIONS,
    sectionOf,
    splitFileName,
    DECISION_TABS,
} from "@pages/protocol-studio/ui/editor/inspector/constants";
import { InspectorCodePane } from "@pages/protocol-studio/ui/editor/inspector/code-pane";
import { EdgeProperties } from "@pages/protocol-studio/ui/editor/inspector/edge-properties";
import { GroupProperties } from "@pages/protocol-studio/ui/editor/inspector/group-properties";
import { MultiSelection } from "@pages/protocol-studio/ui/editor/inspector/multi-selection";
import { NodeProperties } from "@pages/protocol-studio/ui/editor/inspector/node-properties";
import { SaveDataEditor } from "@pages/protocol-studio/ui/editor/inspector/save-data-editor";
import { DecisionProperties } from "@pages/protocol-studio/ui/editor/inspector/decision-properties";
import { ValidationsView } from "@pages/protocol-studio/ui/editor/inspector/validations-view";
import type {
    IInspectorCardProps,
    IInspectorCodePaneProps,
    InspectorTab,
    InspectorTabId,
    NodeFileId,
    NodeSectionId,
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

/** A group has no files of its own: its inspector is the properties form only. */
const NO_TABS: InspectorTab[] = [];

/**
 * Full-height card on the right. A selected API node is shown in four
 * sections — Definition (its fields), Validation (`validator` + the api's
 * `validations.yaml`), Generation (`requirements`, `generate`, `defaultPayload`,
 * `inputs`) and Session (`saveData`) — picked at the top; a section's files are
 * tabs under it. A selected wire shows its own form. With nothing selected the
 * file tabs preview the lib's step templates. Edits are held in memory only.
 * Config-level files (helpers.ts, the raw config) open from the header instead.
 */
export const InspectorCard = ({
    isMaximized,
    onToggleMaximized,
    resizeHandleProps,
    graph,
    inGroup,
    selection,
    activeTab,
    onTabChange,
    actions,
    reveal,
    multiActions,
    helperNames,
    domain,
    version,
    lastSaved,
}: IInspectorCardProps) => {
    const [templates, setTemplates] = useState(() => getTemplateFiles());
    const node =
        selection?.type === "node" ? graph.nodes.find((n) => n.id === selection.id) : undefined;
    const edge =
        selection?.type === "edge" ? graph.edges.find((e) => e.id === selection.id) : undefined;
    const many =
        selection?.type === "nodes"
            ? graph.nodes.filter((n) => selection.ids.includes(n.id))
            : undefined;
    const dec = node?.decision;
    const tabs = dec
        ? DECISION_TABS
        : node?.group
          ? NO_TABS
          : getInspectorTabs(node?.codeLanguage ?? "typescript").filter(
                // exit.ts only exists while the node repeats until it.
                (t) => t.id !== "exit" || !!node?.repeat?.until
            );
    const tab = tabs.find(({ id }) => id === activeTab) ?? tabs[0];
    const showProperties = activeTab === "properties" || !tab;
    // Control nodes have one section's worth of content: no section control.
    const sectioned = !dec && !node?.group;
    const section: NodeSectionId = showProperties ? "definition" : sectionOf(tab.id, tabs);
    const sectionTabs = tabs.filter((t) => t.section === section);

    const valueOf = (id: NodeFileId) => {
        if (id === "decide") return dec?.decide ?? "";
        // A node from an older draft may lack a newer file (e.g. `match`): shown as its template.
        return node ? (node.files[id] ?? templates[id]) : templates[id];
    };

    const change = (id: NodeFileId, value: string) => {
        if (id === "decide") {
            if (node && dec) actions.updateNode(node.id, { decision: { ...dec, decide: value } });
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
                {node.group ? "Sub-protocol" : NODE_KINDS[node.kind].label} ·{" "}
                {dec ? "decides from state" : node.group ? node.group.name : node.owner}
            </p>
        );
    } else if (many) {
        summary = (
            <p className="studio-text-dim truncate text-[12px]">
                <span className="studio-text">{many.length} nodes selected</span> ·{" "}
                {many.map((n) => n.id).join(", ")}
            </p>
        );
    } else if (edge) {
        summary = (
            <p className="studio-text-dim truncate text-[12px]">
                <span className="studio-mono studio-text">
                    {edge.from} → {edge.to}
                </span>{" "}
                · {edge.label ? `“${edge.label}” · ` : ""}
                {EDGE_KINDS[edge.kind].label} wire
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
                    {node || edge || many ? "draft" : "preview"} · saved locally
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

            {many && multiActions ? (
                <div className="studio-well bp-props-well m-3 mt-1 min-h-0 flex-1">
                    <MultiSelection nodes={many} {...multiActions} />
                </div>
            ) : edge ? (
                <div className="studio-well bp-props-well m-3 mt-1 min-h-0 flex-1">
                    <EdgeProperties
                        key={edge.id}
                        edge={edge}
                        nodes={graph.nodes}
                        edges={graph.edges}
                        inGroup={inGroup}
                        actions={actions}
                    />
                </div>
            ) : (
                <TabsPrimitive.Root
                    value={showProperties ? "properties" : tab.id}
                    onValueChange={(value) => onTabChange(value as InspectorTabId)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    {sectioned ? (
                        <div
                            className="studio-segmented studio-sections"
                            role="tablist"
                            aria-label="Node sections"
                        >
                            {NODE_SECTIONS.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    role="tab"
                                    className="studio-segment"
                                    data-state={section === s.id ? "active" : undefined}
                                    aria-selected={section === s.id}
                                    title={s.description}
                                    onClick={() => onTabChange(firstTabOf(s.id, tabs))}
                                >
                                    <s.Icon />
                                    <span className="studio-segment-label">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {sectioned && section === "definition" && sectionTabs.length === 0 ? null : (
                        <TabsPrimitive.List
                            className="studio-filepicker"
                            aria-label="Inspector files"
                            data-section={section}
                        >
                            {sectioned && section !== "definition" ? null : (
                                <div className="studio-filerow" data-group="node">
                                    <TabsPrimitive.Trigger
                                        value="properties"
                                        className="studio-file"
                                        title={
                                            sectioned
                                                ? "The node's own fields"
                                                : dec
                                                  ? "The decision's fields: its cases"
                                                  : "The group's name and description"
                                        }
                                    >
                                        <span className="studio-file-name">Properties</span>
                                    </TabsPrimitive.Trigger>
                                </div>
                            )}
                            {sectionTabs.length ? (
                                <div className="studio-filerow" data-group={section}>
                                    {sectionTabs.map((t) => {
                                        const { base, ext } = splitFileName(t.label);
                                        return (
                                            <TabsPrimitive.Trigger
                                                key={t.id}
                                                value={t.id}
                                                className="studio-file"
                                                title={`${t.label}\n${t.description}`}
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
                            ) : null}
                        </TabsPrimitive.List>
                    )}

                    {showProperties || !tab ? (
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
                            ) : node && node.group ? (
                                <GroupProperties
                                    key={node.id}
                                    node={{ ...node, group: node.group }}
                                    actions={actions}
                                    onEnter={() => actions.enterGroup(node.id)}
                                />
                            ) : node ? (
                                <NodeProperties
                                    key={node.id}
                                    node={node}
                                    nodes={graph.nodes}
                                    wiredInto={hasMainWireIntoLevel(graph, node)}
                                    actions={actions}
                                    onEditFile={onTabChange}
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
                            {tab.id === "validations" ? (
                                <ValidationsView
                                    api={node?.api ?? "search"}
                                    domain={domain}
                                    version={version}
                                />
                            ) : tab.id === "saveData" ? (
                                node ? (
                                    <SaveDataEditor
                                        key={node.id}
                                        nodeId={node.id}
                                        saveData={node.saveData ?? {}}
                                        defaultPayloadSource={node.files.defaultPayload}
                                        version={version}
                                        lastSaved={lastSaved?.[node.id]}
                                        onChange={(saveData) =>
                                            actions.updateNodeSaveData(node.id, saveData)
                                        }
                                    />
                                ) : (
                                    <p className="bp-props-empty">
                                        Select a node to edit what it saves into session data.
                                    </p>
                                )
                            ) : (
                                <InspectorCodePane
                                    path={`studio://${owner}/${tab.label}`}
                                    language={tab.language ?? "typescript"}
                                    value={valueOf(tab.id as NodeFileId)}
                                    onChange={(value) => change(tab.id as NodeFileId, value)}
                                    reveal={reveal?.tab === tab.id ? reveal : null}
                                    compileAs={COMPILE_AS[tab.id as NodeFileId]}
                                    helperNames={helperNames}
                                />
                            )}
                        </TabsPrimitive.Content>
                    )}
                </TabsPrimitive.Root>
            )}
        </section>
    );
};

export default InspectorCard;
