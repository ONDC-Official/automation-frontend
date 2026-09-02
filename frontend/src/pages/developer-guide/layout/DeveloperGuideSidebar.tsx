import { FC, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { ROUTES } from "@constants/routes";
import type { NavNode, DeveloperGuideSidebarProps } from "./navTypes";
import { isNavGroup, isNavLink } from "./navTypes";
import { parseNavPath, isNavLinkActive, isNavGroupPathActive } from "./navMatch";
import { NAV_STATUS_LABEL, NAV_STATUS_STYLES } from "../shared/statusPlaceholders";

const TREE_INDENT_STEP = 14;

const rowInset = (depth: number) => 12 + depth * TREE_INDENT_STEP;

const navTextDefault = "text-n-300 dark:text-text-secondary";
const navTextSelected = "text-n-900 dark:text-text-primary";
const navTextInteractive = `${navTextDefault} hover:text-n-900 dark:hover:text-text-primary`;
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
        "flex flex-1 items-center gap-1 min-w-0 text-left py-1.5 pr-3 text-[13px] leading-snug transition-colors";
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
}> = ({ node, depth }) => {
    const location = useLocation();

    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path);

    const useEnd = node.id === "overview" || Boolean(linkHash);
    const inset = rowInset(depth);

    const linkTitle = node.suffix ? `${node.label} ${node.suffix}` : node.label;

    const resolveIsActive = (routerActive: boolean) =>
        linkHash ? location.pathname === linkPath && location.hash === linkHash : routerActive;

    if (node.disabled) {
        return (
            <div className="w-full min-w-0">
                <div
                    className={`flex w-full min-w-0 items-center gap-1 text-[13px] ${navTextDefault} cursor-not-allowed`}
                    style={{ paddingLeft: inset }}
                >
                    <ChevronSlot />

                    <span className="flex-1 min-w-0 py-1.5 pr-3 wrap-break-word">{node.label}</span>

                    {node.suffix && (
                        <span className={`shrink-0 font-mono text-[11px] ${navTextDefault}`}>
                            {node.suffix}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <div
                className={`flex w-full min-w-0 items-center gap-1 ${navTextDefault}`}
                style={{ paddingLeft: inset }}
            >
                <ChevronSlot showChevron={node.showArrow} rotated />

                <NavLink
                    to={node.path}
                    end={useEnd}
                    className={({ isActive: routerActive }) =>
                        linkClass({
                            isActive: resolveIsActive(routerActive),
                            depth,
                        })
                    }
                    title={linkTitle}
                >
                    <span className="flex-1 min-w-0 wrap-break-word">{node.label}</span>

                    {node.suffix && (
                        <span
                            title={node.status ? NAV_STATUS_LABEL[node.status] : undefined}
                            className={`shrink-0 rounded-full px-2.5 py-2 text-caption-2-size font-bold tracking-tighter leading-none ${
                                node.status
                                    ? NAV_STATUS_STYLES[node.status]
                                    : "bg-transparent text-slate-400 dark:text-slate-500"
                            }`}
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

    const inset = rowInset(depth);
    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path ?? "");
    const groupPathActive = isNavGroupPathActive(node, location.pathname, location.hash);
    const headerActive = linkHash
        ? location.pathname === linkPath && location.hash === linkHash
        : groupPathActive;
    const headerRowActive = headerActive && !hasActiveChild;

    const isSearching = Boolean(searchQuery.trim());
    /** Whether the route/search currently requires this group open, regardless of manual toggles. */
    const routeDrivenOpen = isSearching
        ? true
        : isDeveloperGuideLanding && depth === 0
          ? false
          : hasActiveChild || headerActive;

    const [open, setOpen] = useState(routeDrivenOpen);
    const [appliedRouteDrivenOpen, setAppliedRouteDrivenOpen] = useState(routeDrivenOpen);

    // Adjust `open` during render (not in an effect) when the route/search-driven value
    // changes: React re-renders with the corrected state before committing to the DOM, so
    // the previous (stale) open/closed state is never painted — no post-mount flicker.
    if (routeDrivenOpen !== appliedRouteDrivenOpen) {
        setAppliedRouteDrivenOpen(routeDrivenOpen);
        setOpen(routeDrivenOpen);
    }

    const isMainNode = depth === 0;
    const mainSectionActive = isMainNode && (headerActive || hasActiveChild);
    const nestedRowSelected = !isMainNode && headerRowActive;

    const groupRowTextClass = isMainNode
        ? navTextInteractive
        : nestedRowSelected
          ? `${navTextSelected} font-semibold`
          : navTextInteractive;

    const headerClass = "text-[13px]";

    const rowShellClass = `flex items-center gap-1 min-w-0 transition-colors ${groupRowTextClass} ${
        isMainNode ? mainNodeShell : ""
    } ${mainSectionActive ? mainNodeSelectedBg : ""}`;

    return (
        <div className={`relative ${depth === 0 ? "first:mt-0 not-first:mt-3" : "w-full min-w-0"}`}>
            {node.path ? (
                <div className="w-full min-w-0">
                    <div className={rowShellClass} style={{ paddingLeft: inset }}>
                        {hasChildren ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen((prev) => !prev)}
                                className="h-3.5 w-3.5 shrink-0 rounded-none p-0 has-[>svg]:px-0"
                                aria-expanded={open}
                                aria-label={open ? "Collapse section" : "Expand section"}
                            >
                                {node.showArrow !== false && (
                                    <ChevronDownIcon
                                        className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${open ? "" : "-rotate-90"}`}
                                    />
                                )}
                            </Button>
                        ) : (
                            <ChevronSlot
                                showChevron={node.showArrow !== false && Boolean(node.path)}
                                rotated
                            />
                        )}
                        <NavLink
                            to={node.path}
                            end
                            onClick={() => {
                                // Match chevron behavior: label also toggles expand/collapse.
                                // Needed when route-driven open is already true — navigating to
                                // the same URL won't re-sync `open`, so a closed group would stay closed.
                                if (hasChildren) setOpen((prev) => !prev);
                            }}
                            className={() =>
                                [
                                    "group/header flex-1 min-w-0 py-1.5 pr-3 text-left transition-colors rounded-md flex items-center gap-1",
                                    headerClass,
                                    headerRowActive
                                        ? `${navTextSelected} font-semibold`
                                        : navTextInteractive,
                                ].join(" ")
                            }
                            title={node.label}
                        >
                            <span className="min-w-0 wrap-break-word">{node.label}</span>
                        </NavLink>
                    </div>
                </div>
            ) : hasChildren ? (
                <div className="w-full min-w-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen((prev) => !prev)}
                        className={`w-full h-auto rounded-none p-0 has-[>svg]:px-0 font-normal whitespace-normal ${rowShellClass} text-left`}
                        style={{ paddingLeft: inset }}
                    >
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                            {node.showArrow !== false && (
                                <ChevronDownIcon
                                    className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${open ? "" : "-rotate-90"}`}
                                />
                            )}
                        </span>
                        <span
                            className={`min-w-0 flex-1 py-1.5 pr-3 wrap-break-word ${headerClass}`}
                        >
                            {node.label}
                        </span>
                    </Button>
                </div>
            ) : (
                <div className="w-full min-w-0">
                    <div className={rowShellClass} style={{ paddingLeft: inset }}>
                        <ChevronSlot />
                        <span
                            className={`min-w-0 flex-1 py-1.5 pr-3 wrap-break-word ${headerClass}`}
                        >
                            {node.label}
                        </span>
                    </div>
                </div>
            )}
            {hasChildren && (
                <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                >
                    <div className="min-h-0 overflow-hidden" inert={!open} aria-hidden={!open}>
                        <div className="mt-1 space-y-0.5">
                            {node.children.map((child) => (
                                <NavTreeItem
                                    key={child.id}
                                    node={child}
                                    depth={depth + 1}
                                    searchQuery={searchQuery}
                                />
                            ))}
                        </div>
                    </div>
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
        return (
            <p className="px-2 py-12 text-sm text-text-secondary text-center">No results found</p>
        );
    }

    return (
        <nav className={`py-2 ${navTextDefault}`} aria-label="Developer guide navigation">
            {nodes.map((node) => (
                <NavTreeItem key={node.id} node={node} depth={0} searchQuery={searchQuery} />
            ))}
        </nav>
    );
};

export default DeveloperGuideSidebar;
