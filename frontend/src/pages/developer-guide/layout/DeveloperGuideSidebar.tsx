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
const TREE_ROW_GAP = 12;
/** Matches `py-2` row padding — trunk anchors to the vertical center of each row. */
const TREE_ROW_HALF_HEIGHT = 18;
const TREE_ELBOW_RADIUS = 6;

const treeColumnX = (depth: number) => TREE_COLUMN_OFFSET + depth * TREE_INDENT_STEP;
const rowInset = (depth: number) => 8 + depth * TREE_INDENT_STEP;
/** Horizontal elbow stops at the indent guide — before chevron slot and label text. */
const treeElbowEnd = (depth: number) => rowInset(depth);

const TREE_LINE_COLOR = "bg-n-40 dark:bg-n-60";
const TREE_LINE_BORDER = "border-n-40 dark:border-n-60";

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
        "flex flex-1 items-center gap-1 min-w-0 text-left py-2 pr-2 text-[13px] leading-snug transition-colors";
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
                    <span className="truncate flex-1 min-w-0 py-2 pr-3">{node.label}</span>
                    {node.suffix && (
                        <span className="font-mono text-[11px] text-n-300 dark:text-n-60 shrink-0">
                            {node.suffix}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full${depth === 0 ? " mb-3" : ""}`}>
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
                    <span className="truncate flex-1 min-w-0">{node.label}</span>
                    {node.suffix && (
                        <span
                            title={NAV_STATUS_LABEL[getNavStatus(node.id)]}
                            className={`font-mono text-caption-2-size font-bold tracking-tighter leading-none shrink-0 rounded-full px-2.5 py-1 min-h-0 h-auto ${NAV_STATUS_STYLES[getNavStatus(node.id)]}`}
                        >
                            {node.suffix}
                        </span>
                    )}
                </NavLink>
            </div>
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
        <div className={depth === 0 ? "mb-1 first:mt-0 not-first:mt-4" : ""}>
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
                                className="shrink-0 rounded p-0.5"
                                aria-expanded={open}
                                aria-label={open ? "Collapse section" : "Expand section"}
                            >
                                <ChevronDownIcon
                                    className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
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
                                    "group/header truncate flex-1 min-w-0 py-2 pr-3 text-left transition-colors rounded-md flex items-center gap-1",
                                    headerClass,
                                ].join(" ")
                            }
                            title={node.label}
                        >
                            <span className="truncate">{node.label}</span>
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
                        <ChevronDownIcon
                            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
                        />
                        <span className={`truncate py-2 pr-3 ${headerClass}`}>{node.label}</span>
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
                        <span className={`truncate py-2 pr-3 ${headerClass}`}>{node.label}</span>
                    </div>
                </div>
            )}
            {open && (
                <div
                    className={`relative ${depth === 0 ? "mt-3 mb-1 space-y-3" : "mt-3 space-y-3"}`}
                >
                    {node.children.length > 1 && (
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute z-0 w-px ${TREE_LINE_COLOR}`}
                            style={{
                                left: treeColumnX(depth + 1),
                                top: TREE_ROW_HALF_HEIGHT,
                                bottom: TREE_ROW_HALF_HEIGHT,
                            }}
                        />
                    )}
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
