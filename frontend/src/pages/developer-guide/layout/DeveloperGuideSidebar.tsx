import { FC, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { ROUTES } from "@constants/routes";
import { useDeveloperGuideShell } from "./DeveloperGuideShellContext";
import type { NavNode, DeveloperGuideSidebarProps } from "./navTypes";
import { isNavGroup, isNavLink } from "./navTypes";
import { parseNavPath, isNavLinkActive, isNavGroupPathActive } from "./navMatch";
import { getNavStatus, NAV_STATUS_LABEL, NAV_STATUS_STYLES } from "../shared/statusPlaceholders";

/** Horizontal distance (px) between successive depth levels; shared by the connector column
 *  math and the `paddingLeft` of every row so deeper levels read as clearly nested rather
 *  than a single flat trunk with tiny jogs. */
const TREE_INDENT_STEP = 20;
/** Offset (px) from a depth's left edge to where its vertical connector column sits.
 *  Negative so the column sits further from the row's content, giving the horizontal
 *  tee a short but visible ~12-16px run instead of a near-invisible stub. */
const TREE_COLUMN_OFFSET = -4;
/** Vertical gap (px) between sibling rows, and between a group's header and its first
 *  child — mirrored by the `mt`/`space-y` utilities on the children wrapper below so a
 *  connector can bridge fully into that breathing room instead of leaving a bare gap. */
const TREE_ROW_GAP = 12;
/** Fixed distance (px) from a row's own top edge to its vertical center — every row renders
 *  at the same height, so this lets the trunk (owned by the parent, see below) anchor to a
 *  row's center without depending on the size of whatever the row itself expands into. */
const TREE_ROW_HALF_HEIGHT = 20;
/** Corner radius (px) of the elbow join; also used to pull the continuing trunk segment
 *  up so it overlaps the elbow's still-straight run instead of starting right at the
 *  geometric corner, where the curve has already swept away from the column — without this
 *  overlap the rounded join and the trunk below it render as two visibly separate pieces. */
const TREE_ELBOW_RADIUS = 6;
/** Shared color for connector lines: subtle in both themes, never a primary visual element. */
const TREE_LINE_COLOR = "bg-[#DFE1E4] dark:bg-slate-700/60";
const TREE_LINE_BORDER = "border-[#DFE1E4] dark:border-slate-700/60";

const treeColumnX = (depth: number) => TREE_COLUMN_OFFSET + depth * TREE_INDENT_STEP;

/**
 * Renders a row's own elbow — a rounded join (border-left + border-bottom, rounded at the
 * corner) that bridges upward into the gap above this row and curves into the row's content.
 * This is purely the "this row joins its column" piece; the trunk that continues past this
 * row to its next sibling is owned by the parent (see the children map in `NavGroupItem`),
 * because that trunk must span however tall this row's own expanded subtree turns out to be —
 * something only the parent's wrapper naturally sizes to. `contentStart` is the row's own
 * `paddingLeft`, so the horizontal leg always reaches the row's content instead of stopping short.
 */
const TreeConnectors: FC<{ depth: number; contentStart: number }> = ({ depth, contentStart }) => {
    if (depth === 0) return null;

    const x = treeColumnX(depth);
    const width = Math.max(contentStart - x, 0);

    return (
        <span
            aria-hidden="true"
            className={`absolute border-l border-b ${TREE_LINE_BORDER} rounded-bl-[6px]`}
            style={{ left: x, top: -TREE_ROW_GAP, width, height: `calc(50% + ${TREE_ROW_GAP}px)` }}
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

/** True when a descendant link/group matches the current URL (not the node itself). */
function nodeHasActiveDescendant(
    node: Extract<NavNode, { type: "group" }>,
    pathname: string,
    hash: string
): boolean {
    return node.children.some((child) => nodeContainsActivePath(child, pathname, hash));
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
        "group relative flex items-center gap-1.5 w-full text-left py-2 pr-2 rounded-lg text-[13px] leading-snug transition-all min-w-0",
        isActive
            ? "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 font-semibold shadow-[inset_0_0_0_1px_rgba(14,165,233,0.2)]"
            : "text-slate-600 hover:text-slate-900 hover:bg-white/80 dark:hover:bg-surface-muted/80",
    ].join(" ");

const NavLinkItem: FC<{
    node: Extract<NavNode, { type: "link" }>;
    depth: number;
}> = ({ node, depth }) => {
    const location = useLocation();
    const { collapseNavSidebar } = useDeveloperGuideShell();
    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path);
    const paddingLeft = 12 + depth * TREE_INDENT_STEP;
    const useEnd = node.id === "overview" || Boolean(linkHash);

    const linkTitle = node.suffix ? `${node.label} ${node.suffix}` : node.label;

    const resolveIsActive = (routerActive: boolean) =>
        linkHash ? location.pathname === linkPath && location.hash === linkHash : routerActive;

    if (node.disabled) {
        return (
            <div
                className="relative flex items-center gap-1.5 py-2 pr-3 text-[13px] text-slate-300 cursor-not-allowed min-w-0"
                style={{ paddingLeft }}
                title={linkTitle}
            >
                <TreeConnectors depth={depth} contentStart={paddingLeft} />
                <span className="truncate">{node.label}</span>
                {node.suffix && (
                    <span className="font-mono text-[11px] text-slate-300 shrink-0">
                        {node.suffix}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`relative${depth === 0 ? " mb-3" : ""}`}>
            <TreeConnectors depth={depth} contentStart={paddingLeft} />
            <NavLink
                to={node.path}
                end={useEnd}
                onClick={() => {
                    if (node.collapseOnNavigate) collapseNavSidebar();
                }}
                className={({ isActive: routerActive }) =>
                    linkClass({ isActive: resolveIsActive(routerActive) })
                }
                style={{ paddingLeft }}
                title={linkTitle}
            >
                <span className="truncate flex-1 min-w-0">{node.label}</span>
                {node.suffix && (
                    <span
                        title={NAV_STATUS_LABEL[getNavStatus(node.id)]}
                        className={`font-mono text-caption-2-size font-semibold leading-none shrink-0 rounded-full px-1.5 py-px min-h-0 h-auto ${NAV_STATUS_STYLES[getNavStatus(node.id)]}`}
                    >
                        {node.suffix}
                    </span>
                )}
            </NavLink>
        </div>
    );
};

const NavGroupItem: FC<{
    node: Extract<NavNode, { type: "group" }>;
    depth: number;
    searchQuery: string;
}> = ({ node, depth, searchQuery }) => {
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

    const paddingLeft = 8 + depth * TREE_INDENT_STEP;
    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path ?? "");
    const groupPathActive = isNavGroupPathActive(node, location.pathname, location.hash);
    const headerActive = linkHash
        ? location.pathname === linkPath && location.hash === linkHash
        : groupPathActive;
    const headerRowActive = headerActive && !hasActiveChild;

    useEffect(() => {
        if (searchQuery.trim()) return;

        // Keep only the active route branch expanded; collapse siblings.
        if (isDeveloperGuideLanding && depth === 0) {
            setOpen(false);
            return;
        }

        setOpen(hasActiveChild || headerActive);
    }, [hasActiveChild, headerActive, searchQuery, isDeveloperGuideLanding, depth, node.id]);
    const headerClass =
        depth === 0
            ? "text-[11px] uppercase tracking-widest font-semibold"
            : "text-[13px] font-semibold";

    return (
        <div className={depth === 0 ? "mb-1 first:mt-0 not-first:mt-4" : ""}>
            {node.path ? (
                <div
                    className={`relative flex items-center gap-1 w-full py-2 pr-3 rounded-lg transition-colors ${
                        headerRowActive
                            ? "bg-sky-50 dark:bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.2)]"
                            : ""
                    }`}
                    style={{ paddingLeft }}
                >
                    <TreeConnectors depth={depth} contentStart={paddingLeft} />
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={() => setOpen((prev) => !prev)}
                            className={`p-0.5 rounded hover:bg-white/80 dark:hover:bg-surface-muted/80 shrink-0 ${
                                headerRowActive
                                    ? "text-sky-500 dark:text-sky-400"
                                    : "text-slate-400"
                            }`}
                            aria-expanded={open}
                            aria-label={open ? "Collapse section" : "Expand section"}
                        >
                            <FiChevronDown
                                size={14}
                                className={`transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
                            />
                        </button>
                    )}
                    <NavLink
                        to={node.path}
                        end
                        className={() =>
                            [
                                "group/header truncate flex-1 min-w-0 text-left transition-colors rounded-md px-1 py-0.5 flex items-center gap-1",
                                headerClass,
                                headerRowActive
                                    ? "text-sky-700 dark:text-sky-300"
                                    : depth === 0
                                      ? "text-slate-500 hover:text-slate-700"
                                      : "text-slate-800 hover:bg-white/80 dark:hover:bg-surface-muted/80",
                            ].join(" ")
                        }
                        title={node.label}
                    >
                        <span className="truncate">{node.label}</span>
                    </NavLink>
                </div>
            ) : hasChildren ? (
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className={`relative flex items-center gap-2 w-full text-left py-2 pr-3 rounded-lg transition-colors ${
                        depth === 0
                            ? "text-[11px] uppercase tracking-widest font-semibold text-slate-500 hover:text-slate-700"
                            : "text-[13px] font-semibold text-slate-800 hover:bg-white/80 dark:hover:bg-surface-muted/80"
                    }`}
                    style={{ paddingLeft }}
                >
                    <TreeConnectors depth={depth} contentStart={paddingLeft} />
                    <FiChevronDown
                        size={14}
                        className={`text-slate-400 shrink-0 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
                    />
                    <span className="truncate">{node.label}</span>
                </button>
            ) : (
                <div
                    className={`relative flex items-center gap-2 w-full py-2 pr-3 rounded-lg ${
                        depth === 0
                            ? "text-[11px] uppercase tracking-widest font-semibold text-slate-500"
                            : "text-[13px] font-semibold text-slate-800"
                    }`}
                    style={{ paddingLeft }}
                >
                    <TreeConnectors depth={depth} contentStart={paddingLeft} />
                    <span className="truncate">{node.label}</span>
                </div>
            )}
            {open && (
                <div className={depth === 0 ? "mt-3 mb-1 space-y-3" : "mt-3 space-y-3"}>
                    {node.children.map((child, index) => {
                        const childIsLast = index === node.children.length - 1;
                        const childX = treeColumnX(depth + 1);
                        return (
                            <div key={child.id} className="relative">
                                <NavTreeItem
                                    node={child}
                                    depth={depth + 1}
                                    searchQuery={searchQuery}
                                />
                                {/* Trunk for this child, owned here (not by the child itself) so it
                                    naturally spans however tall the child's own expanded subtree is,
                                    instead of stopping at a fixed height and leaving the rest of the
                                    domain list looking like it restarts its own connector system. */}
                                {!childIsLast && (
                                    <span
                                        aria-hidden="true"
                                        className={`absolute w-px ${TREE_LINE_COLOR}`}
                                        style={{
                                            left: childX,
                                            top: TREE_ROW_HALF_HEIGHT - TREE_ELBOW_RADIUS,
                                            bottom: -TREE_ROW_GAP,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const NavTreeItem: FC<{
    node: NavNode;
    depth: number;
    searchQuery: string;
}> = ({ node, depth, searchQuery }) => {
    if (isNavLink(node)) {
        return <NavLinkItem node={node} depth={depth} />;
    }

    if (isNavGroup(node)) {
        return <NavGroupItem node={node} depth={depth} searchQuery={searchQuery} />;
    }

    return null;
};

const DeveloperGuideSidebar: FC<DeveloperGuideSidebarProps> = ({ nodes, searchQuery }) => {
    if (nodes.length === 0) {
        return <p className="px-2 py-12 text-sm text-slate-500 text-center">No results found</p>;
    }

    return (
        <nav className="py-2 space-y-1" aria-label="Developer guide navigation">
            {nodes.map((node) => (
                <NavTreeItem key={node.id} node={node} depth={0} searchQuery={searchQuery} />
            ))}
        </nav>
    );
};

export default DeveloperGuideSidebar;
