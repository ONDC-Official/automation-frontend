import { CubeTransparentIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import type { ExplorerTab, HeroIcon } from "@pages/protocol-studio/ui/editor/types";

export const EXPLORER_TABS: { id: ExplorerTab; label: string; hint: string; Icon: HeroIcon }[] = [
    {
        id: "nodes",
        label: "Nodes",
        hint: "Every node on the graph",
        Icon: CubeTransparentIcon,
    },
    {
        id: "search",
        label: "Search",
        hint: "Find code across every node's files",
        Icon: MagnifyingGlassIcon,
    },
];

/** Characters of context kept before a search match in a result row. */
export const SNIPPET_LEAD = 24;
