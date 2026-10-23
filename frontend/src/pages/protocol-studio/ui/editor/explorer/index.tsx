import { useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";

import { EXPLORER_TABS } from "@pages/protocol-studio/ui/editor/explorer/constants";
import { NodesTab } from "@pages/protocol-studio/ui/editor/explorer/nodes-tab";
import { SearchTab } from "@pages/protocol-studio/ui/editor/explorer/search-tab";
import type {
    ExplorerTab,
    IExplorerCardProps,
    SearchOptions,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * Full-height card on the left, the inspector's mirror: the nodes on the graph
 * and a search across their code. Collapsed, it is a slim rail of view icons,
 * as the dock is just its tab bar. The search query lives here, so it survives
 * tab switches and collapsing.
 */
export const ExplorerCard = ({
    isOpen,
    onToggleOpen,
    tab,
    onTabChange,
    isHidden,
    resizeHandleProps,
    nodesTab,
    searchTab,
}: IExplorerCardProps) => {
    const [searchOptions, setSearchOptions] = useState<SearchOptions>({
        query: "",
        matchCase: false,
        regex: false,
    });
    const nodeCount = nodesTab.graph.nodes.length;

    if (!isOpen) {
        return (
            <nav
                className="studio-glass studio-explorer studio-explorer-rail"
                aria-label="Explorer"
                inert={isHidden}
            >
                <button
                    type="button"
                    className="studio-key studio-key-sm studio-key-icon"
                    onClick={onToggleOpen}
                    aria-expanded={false}
                    aria-label="Expand explorer"
                    title="Expand explorer"
                >
                    <ChevronDoubleRightIcon />
                </button>
                <span className="studio-rail-divider" aria-hidden="true" />
                {EXPLORER_TABS.map(({ id, label, hint, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        className="studio-key studio-key-sm studio-key-icon"
                        onClick={() => onTabChange(id)}
                        aria-label={`Open ${label}`}
                        title={`${label} · ${hint}`}
                    >
                        <Icon />
                        {id === "nodes" && nodeCount > 0 ? (
                            <span className="studio-count studio-rail-badge">{nodeCount}</span>
                        ) : null}
                    </button>
                ))}
            </nav>
        );
    }

    return (
        <section
            className="studio-glass studio-explorer flex flex-col"
            aria-label="Explorer"
            inert={isHidden}
        >
            <div
                className="studio-handle studio-handle-x-end"
                aria-label="Resize explorer"
                title="Drag to resize · double-click to reset"
                {...resizeHandleProps}
            />

            <TabsPrimitive.Root
                value={tab}
                onValueChange={(value) => onTabChange(value as ExplorerTab)}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="studio-explorer-head">
                    <TabsPrimitive.List
                        className="studio-segmented min-w-0 flex-1"
                        aria-label="Explorer views"
                    >
                        {EXPLORER_TABS.map(({ id, label, hint, Icon }) => (
                            <TabsPrimitive.Trigger
                                key={id}
                                value={id}
                                className="studio-segment"
                                title={`${label} · ${hint}`}
                            >
                                <Icon />
                                <span className="studio-segment-label">{label}</span>
                            </TabsPrimitive.Trigger>
                        ))}
                    </TabsPrimitive.List>
                    <button
                        type="button"
                        className="studio-key studio-key-sm studio-key-icon"
                        onClick={onToggleOpen}
                        aria-expanded
                        aria-label="Collapse explorer"
                        title="Collapse explorer"
                    >
                        <ChevronDoubleLeftIcon />
                    </button>
                </div>

                <TabsPrimitive.Content value="nodes" className="min-h-0 flex-1 outline-none">
                    <NodesTab {...nodesTab} />
                </TabsPrimitive.Content>
                <TabsPrimitive.Content value="search" className="min-h-0 flex-1 outline-none">
                    <SearchTab
                        {...searchTab}
                        options={searchOptions}
                        onOptionsChange={setSearchOptions}
                    />
                </TabsPrimitive.Content>
            </TabsPrimitive.Root>
        </section>
    );
};

export default ExplorerCard;
