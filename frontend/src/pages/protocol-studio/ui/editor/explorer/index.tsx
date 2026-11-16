import { useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { EXPLORER_TABS } from "@pages/protocol-studio/ui/editor/explorer/constants";
import { NodesTab } from "@pages/protocol-studio/ui/editor/explorer/nodes-tab";
import { SearchTab } from "@pages/protocol-studio/ui/editor/explorer/search-tab";
import { splitFileName } from "@pages/protocol-studio/ui/editor/inspector/constants";
import type {
    ExplorerTab,
    IExplorerCardProps,
    IExplorerConfigFile,
    SearchOptions,
} from "@pages/protocol-studio/ui/editor/types";

/** "Shared code": a config-level file, pinned above the views. */
const ConfigFileRow = ({ file }: { file: IExplorerConfigFile }) => {
    const name = splitFileName(file.label);
    return (
        <button
            type="button"
            className="studio-tree-action bp-tree-row studio-explorer-file"
            data-explorer-file={file.id}
            onClick={file.onOpen}
            title={`${file.label} · ${file.hint}`}
        >
            <span className="bp-tree-kind">
                <WrenchScrewdriverIcon />
            </span>
            <span className="flex min-w-0 flex-col items-start">
                <span className="studio-mono truncate">
                    {name.base}
                    <span className="studio-file-ext">{name.ext}</span>
                </span>
                <span className="studio-text-faint truncate text-[11px]">{file.hint}</span>
            </span>
            <span className="studio-badge ml-auto">shared</span>
        </button>
    );
};

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
    configFiles = [],
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
                {configFiles.length > 0 ? (
                    <span className="studio-rail-divider" aria-hidden="true" />
                ) : null}
                {configFiles.map((file) => (
                    <button
                        key={file.id}
                        type="button"
                        className="studio-key studio-key-sm studio-key-icon"
                        data-explorer-file={file.id}
                        onClick={file.onOpen}
                        aria-label={`Open ${file.label}`}
                        title={`${file.label} · ${file.hint}`}
                    >
                        <WrenchScrewdriverIcon />
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

                {configFiles.length > 0 ? (
                    <div className="studio-explorer-files" aria-label="Shared code">
                        <span className="studio-eyebrow px-1">Shared code</span>
                        {configFiles.map((file) => (
                            <ConfigFileRow key={file.id} file={file} />
                        ))}
                    </div>
                ) : null}

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
