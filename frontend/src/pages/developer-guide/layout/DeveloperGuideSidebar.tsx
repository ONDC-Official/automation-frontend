import { FC, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ROUTES } from "@constants/routes";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import type { NavNode, DeveloperGuideSidebarProps } from "./navTypes";
import { isNavGroup, isNavLink } from "./navTypes";
import { parseNavPath, isNavLinkActive, isNavGroupPathActive } from "./navMatch";
import { getNavStatus, NAV_STATUS_LABEL, NAV_STATUS_STYLES } from "../shared/statusPlaceholders";

const TREE_INDENT_STEP = 20;
const TREE_COLUMN_OFFSET = -4;
const TREE_ROW_GAP = 0;
/** Matches `py-2` row padding — trunk anchors to the vertical center of each row. */
const TREE_ROW_HALF_HEIGHT = 12;
const TREE_ELBOW_RADIUS = 6;
const CHEVRON_ICON_SIZE = 14;
/** Equal clearance between tree lines and the chevron on the left and below. */
const TREE_ICON_GAP = 4;

const treeColumnX = (depth: number) => TREE_COLUMN_OFFSET + depth * TREE_INDENT_STEP;
const rowInset = (depth: number) => 8 + depth * TREE_INDENT_STEP;
/** Horizontal elbow stops before the chevron slot with uniform spacing. */
const treeElbowEnd = (depth: number) => rowInset(depth) - TREE_ICON_GAP;

const chevronHalf = CHEVRON_ICON_SIZE / 2;
/** Vertical descent from below the chevron down to the first child row center. */
const groupDescentStyle = (depth: number) => {
    const top = -(TREE_ROW_HALF_HEIGHT - chevronHalf - TREE_ICON_GAP + TREE_ROW_GAP);
    return {
        left: treeColumnX(depth + 1),
        top,
        height: TREE_ROW_HALF_HEIGHT - top,
    };
};

const TREE_LINE_COLOR = "bg-n-40 dark:bg-n-60";
const TREE_LINE_BORDER = "border-n-40 dark:border-border-default";

const navTextDefault = "text-n-300 dark:text-n-60";
const navTextSelected = "text-n-900 dark:text-n-0";
const navTextInteractive = `${navTextDefault} hover:text-n-900 dark:hover:text-n-0`;
const mainNodeShell = "rounded-xl";
const mainNodeSelectedBg = "bg-brand-light dark:bg-brand-normal/10";

const ChevronSlot: FC<{ showChevron?: boolean; rotated?: boolean }> = ({
    showChevron = false,
    rotated = false,
}) =>
    showChevron ? (
        <ChevronDownIcon
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${rotated ? "-rotate-90" : ""}`}
            aria-hidden
        />
    ) : (
        <span className="w-3.5 h-3.5 shrink-0" aria-hidden />
    );

/** Vertical stem from below an expanded group chevron to the first child row only. */
const GroupDescentConnector: FC<{ depth: number }> = ({ depth }) => (
    <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-0 w-px ${TREE_LINE_COLOR}`}
        style={groupDescentStyle(depth)}
    />
);

/** Connects sibling rows at the same depth; skips through expanded child subtrees. */
const InterSiblingTrunk: FC<{ depth: number; spansSubtree: boolean }> = ({
    depth,
    spansSubtree,
}) => {
    if (depth === 0) return null;

    return (
        <span
            aria-hidden="true"
            className={`pointer-events-none absolute z-0 w-px ${TREE_LINE_COLOR}`}
            style={
                spansSubtree
                    ? {
                          left: treeColumnX(depth),
                          top: "100%",
                          height: TREE_ROW_GAP,
                      }
                    : {
                          left: treeColumnX(depth),
                          top: TREE_ROW_HALF_HEIGHT,
                          height: `calc(100% - ${TREE_ROW_HALF_HEIGHT}px + ${TREE_ROW_GAP}px)`,
                      }
            }
        />
    );
};

/** Elbow from the parent column to the row indent; last sibling gets a rounded end cap. */
const TreeConnectors: FC<{
    depth: number;
    isLastSibling: boolean;
}> = ({ depth, isLastSibling }) => {
    if (depth === 0) return null;

    const x = treeColumnX(depth);
    const width = Math.max(treeElbowEnd(depth) - x, 0);

    return (
        <span
            aria-hidden="true"
            className={`pointer-events-none absolute z-0 border-l border-b ${TREE_LINE_BORDER}`}
            style={{
                left: x,
                top: -TREE_ROW_GAP,
                width,
                height: `calc(50% + ${TREE_ROW_GAP}px)`,
                borderBottomLeftRadius: isLastSibling ? TREE_ELBOW_RADIUS : 0,
            }}
        />
    );
};

function nodeContainsActivePath(node: NavNode, pathname: string, hash: string): boolean {
    if (isNavLink(node)) {
        return isNavLinkActive(node, pathname, hash);
    }
    if (isNavGroupPathActive(node, pathname, hash)) return true;
    return node.children.some((child) => nodeContainsActivePath(child, pathname, hash));
}

function nodeHasActiveDescendant(
    node: Extract<NavNode, { type: "group" }>,
    pathname: string,
    hash: string
): boolean {
    return node.children.some((child) => nodeContainsActivePath(child, pathname, hash));
}

const linkClass = ({ isActive, depth }: { isActive: boolean; depth: number }) => {
    const base =
        "flex flex-1 items-center gap-1 min-w-0 text-left py-1 pr-2 text-[13px] leading-snug transition-colors";
    const rounding = depth === 0 ? mainNodeShell : "rounded-lg";

    if (depth === 0) {
        return [base, rounding, navTextInteractive, isActive ? mainNodeSelectedBg : ""].join(" ");
    }

    return [
        base,
        rounding,
        isActive ? `${navTextSelected} font-semibold` : navTextInteractive,
    ].join(" ");
};

const NavLinkItem: FC<{
    node: Extract<NavNode, { type: "link" }>;
    depth: number;
    isLastSibling: boolean;
}> = ({ node, depth, isLastSibling }) => {
    const location = useLocation();
    const { collapseNavSidebar } = useDeveloperGuideShell();
    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path);
    const useEnd = node.id === "overview" || Boolean(linkHash);
    const inset = rowInset(depth);
    const reserveChevronSlot = depth > 0;

    const linkTitle = node.suffix ? `${node.label} ${node.suffix}` : node.label;

    const resolveIsActive = (routerActive: boolean) =>
        linkHash ? location.pathname === linkPath && location.hash === linkHash : routerActive;

    if (node.disabled) {
        return (
            <div className="relative w-full min-w-0">
                <TreeConnectors depth={depth} isLastSibling={isLastSibling} />
                <div
                    className="relative z-10 flex items-center gap-1 w-full text-[13px] text-n-300 dark:text-n-60 cursor-not-allowed min-w-0"
                    style={{ paddingLeft: inset }}
                >
                    {reserveChevronSlot && <ChevronSlot />}
                    <span className="flex-1 min-w-0 py-1 pr-3">{node.label}</span>
                    {node.suffix && (
                        <span className="font-mono text-[11px] text-n-300 dark:text-n-60 shrink-0">
                            {node.suffix}
                        </span>
                    )}
                </div>
                {!isLastSibling && <InterSiblingTrunk depth={depth} spansSubtree={false} />}
            </div>
        );
    }

    return (
        <div className={`relative w-full min-w-0${depth === 0 ? " mb-1" : ""}`}>
            <TreeConnectors depth={depth} isLastSibling={isLastSibling} />
            <div
                className="relative z-10 flex items-center w-full min-w-0"
                style={{ paddingLeft: inset }}
            >
                {reserveChevronSlot && <ChevronSlot showChevron={node.showArrow} rotated />}
                <NavLink
                    to={node.path}
                    end={useEnd}
                    onClick={() => {
                        if (node.collapseOnNavigate) collapseNavSidebar();
                    }}
                    className={({ isActive: routerActive }) =>
                        linkClass({ isActive: resolveIsActive(routerActive), depth })
                    }
                    title={linkTitle}
                >
                    <span className="flex-1 min-w-0">{node.label}</span>
                    {node.suffix && (
                        <span
                            title={NAV_STATUS_LABEL[getNavStatus(node.id)]}
                            className={`text-caption-2-size font-bold tracking-tighter leading-none shrink-0 rounded-full px-2.5 py-2 min-h-0 h-auto ${NAV_STATUS_STYLES[getNavStatus(node.id)]}`}
                        >
                            {node.suffix}
                        </span>
                    )}
                </NavLink>
            </div>
            {!isLastSibling && <InterSiblingTrunk depth={depth} spansSubtree={false} />}
        </div>
    );
};

const NavGroupItem: FC<{
    node: Extract<NavNode, { type: "group" }>;
    depth: number;
    searchQuery: string;
    isLastSibling: boolean;
}> = ({ node, depth, searchQuery, isLastSibling }) => {
    const hasChildren = node.children.length > 0;
    const location = useLocation();
    const isDeveloperGuideLanding =
        (location.pathname === ROUTES.DEVELOPER_GUIDE ||
            location.pathname === `${ROUTES.DEVELOPER_GUIDE}/`) &&
        !location.hash;
    const hasActiveChild = useMemo(
        () => nodeHasActiveDescendant(node, location.pathname, location.hash),
        [node, location.pathname, location.hash]
    );
    const [open, setOpen] = useState(() => {
        if (isDeveloperGuideLanding && depth === 0) {
            return false;
        }
        return node.defaultOpen ?? (depth < 1 || hasActiveChild);
    });

    useEffect(() => {
        if (searchQuery.trim()) setOpen(true);
    }, [searchQuery]);

    const inset = rowInset(depth);
    const reserveChevronSlot = depth > 0 || hasChildren;
    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path ?? "");
    const groupPathActive = isNavGroupPathActive(node, location.pathname, location.hash);
    const headerActive = linkHash
        ? location.pathname === linkPath && location.hash === linkHash
        : groupPathActive;
    const headerRowActive = headerActive && !hasActiveChild;

    useEffect(() => {
        if (searchQuery.trim()) return;

        if (isDeveloperGuideLanding && depth === 0) {
            setOpen(false);
            return;
        }

        setOpen(hasActiveChild || headerActive);
    }, [hasActiveChild, headerActive, searchQuery, isDeveloperGuideLanding, depth, node.id]);

    const isMainNode = depth === 0;
    const mainSectionActive = isMainNode && (headerActive || hasActiveChild);
    const nestedRowSelected = !isMainNode && headerRowActive;

    const groupRowTextClass = isMainNode
        ? navTextInteractive
        : nestedRowSelected
          ? `${navTextSelected} font-semibold`
          : `${navTextInteractive} font-semibold`;

    const headerClass = "text-[13px] font-semibold";

    const rowShellClass = `flex items-center gap-1 w-full min-w-0 transition-colors ${groupRowTextClass} ${
        isMainNode ? mainNodeShell : ""
    } ${mainSectionActive ? mainNodeSelectedBg : ""}`;

    return (
        <div
            className={`relative ${depth === 0 ? "mb-1 first:mt-0 not-first:mt-2" : "w-full min-w-0"}`}
        >
            {node.path ? (
                <div className="relative w-full min-w-0">
                    <TreeConnectors depth={depth} isLastSibling={isLastSibling} />
                    <div
                        className={`relative z-10 ${rowShellClass}`}
                        style={{ paddingLeft: inset }}
                    >
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={() => setOpen((prev) => !prev)}
                                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
                                aria-expanded={open}
                                aria-label={open ? "Collapse section" : "Expand section"}
                            >
                                <ChevronDownIcon
                                    className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
                                />
                            </button>
                        ) : (
                            reserveChevronSlot && <ChevronSlot />
                        )}
                        <NavLink
                            to={node.path}
                            end
                            className={() =>
                                [
                                    "group/header flex-1 min-w-0 py-1 pr-3 text-left transition-colors rounded-md flex items-center gap-1",
                                    headerClass,
                                ].join(" ")
                            }
                            title={node.label}
                        >
                            <span>{node.label}</span>
                        </NavLink>
                    </div>
                </div>
            ) : hasChildren ? (
                <div className="relative w-full min-w-0">
                    <TreeConnectors depth={depth} isLastSibling={isLastSibling} />
                    <button
                        type="button"
                        onClick={() => setOpen((prev) => !prev)}
                        className={`relative z-10 ${rowShellClass} text-left`}
                        style={{ paddingLeft: inset }}
                    >
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                            <ChevronDownIcon
                                className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
                            />
                        </span>
                        <span className={`py-1 pr-3 ${headerClass}`}>{node.label}</span>
                    </button>
                </div>
            ) : (
                <div className="relative w-full min-w-0">
                    <TreeConnectors depth={depth} isLastSibling={isLastSibling} />
                    <div
                        className={`relative z-10 ${rowShellClass}`}
                        style={{ paddingLeft: inset }}
                    >
                        {reserveChevronSlot && <ChevronSlot />}
                        <span className={`py-1 pr-3 ${headerClass}`}>{node.label}</span>
                    </div>
                </div>
            )}
            {open && (
                <div className={`relative ${depth === 0 ? "mt-2 mb-1" : "mt-2"}`}>
                    {hasChildren && <GroupDescentConnector depth={depth} />}
                    {node.children.map((child, index) => (
                        <NavTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            searchQuery={searchQuery}
                            isLastSibling={index === node.children.length - 1}
                        />
                    ))}
                </div>
            )}
            {!isLastSibling && (
                <InterSiblingTrunk depth={depth} spansSubtree={open && hasChildren} />
            )}
        </div>
    );
};

const NavTreeItem: FC<{
    node: NavNode;
    depth: number;
    searchQuery: string;
    isLastSibling: boolean;
}> = ({ node, depth, searchQuery, isLastSibling }) => {
    if (isNavLink(node)) {
        return <NavLinkItem node={node} depth={depth} isLastSibling={isLastSibling} />;
    }

    if (isNavGroup(node)) {
        return (
            <NavGroupItem
                node={node}
                depth={depth}
                searchQuery={searchQuery}
                isLastSibling={isLastSibling}
            />
        );
    }

    return null;
};

const DeveloperGuideSidebar: FC<DeveloperGuideSidebarProps> = ({ nodes, searchQuery }) => {
    if (nodes.length === 0) {
        return (
            <p className="px-2 py-12 text-sm text-text-secondary text-center">No results found</p>
        );
    }

    return (
        <nav className="py-2 space-y-1" aria-label="Developer guide navigation">
            {nodes.map((node, index) => (
                <NavTreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    searchQuery={searchQuery}
                    isLastSibling={index === nodes.length - 1}
                />
            ))}
        </nav>
    );
};

export default DeveloperGuideSidebar;
