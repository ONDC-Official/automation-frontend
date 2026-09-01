import type { ReactNode } from "react";
import type { NavNode } from "@/types/apiShared/developerGuide";

// Canonical type lives in @/types/apiShared/developerGuide; re-exported here so existing
// feature imports don't need to change.
export type { NavNode } from "@/types/apiShared/developerGuide";
export { isNavGroup, isNavLink } from "@/types/apiShared/developerGuide";

export interface DeveloperGuideSidebarProps {
    nodes: NavNode[];
    searchQuery: string;
}

export interface DeveloperGuideGuideCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: ReactNode;
    onClick?: () => void;
    className?: string;
}
