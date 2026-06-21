import { isNavGroup, isNavLink, type NavNode } from "./navTypes";
import { isNavGroupPathActive, isNavLinkActive, parseNavPath } from "./navMatch";

export interface BreadcrumbCrumb {
    id: string;
    label: string;
    path?: string;
}

/** True when a group's own path lands on `pathname`, ignoring any hash the group's default link carries. */
function isGroupPathnameMatch(
    node: Extract<NavNode, { type: "group" }>,
    pathname: string
): boolean {
    if (!node.path) return false;
    return parseNavPath(node.path).pathname === pathname;
}

function findTrailInNode(
    node: NavNode,
    pathname: string,
    hash: string,
    matchHash: boolean
): BreadcrumbCrumb[] | null {
    if (isNavLink(node)) {
        return isNavLinkActive(node, pathname, hash)
            ? [{ id: node.id, label: node.label, path: node.path }]
            : null;
    }

    if (isNavGroup(node)) {
        for (const child of node.children) {
            const childTrail = findTrailInNode(child, pathname, hash, matchHash);
            if (childTrail) {
                return [{ id: node.id, label: node.label, path: node.path }, ...childTrail];
            }
        }

        const groupMatches = matchHash
            ? isNavGroupPathActive(node, pathname, hash)
            : isGroupPathnameMatch(node, pathname);
        if (groupMatches) {
            return [{ id: node.id, label: node.label, path: node.path }];
        }
    }

    return null;
}

/**
 * Ancestor-to-leaf breadcrumb trail for the nav-tree node matching the current location.
 * Falls back to a pathname-only match when nothing matches the exact hash — e.g. a group
 * page (like Getting Started) whose own link defaults to its first section's hash still
 * needs a breadcrumb when visited directly, without that hash, in the URL.
 */
export function findBreadcrumbTrail(
    nodes: NavNode[],
    pathname: string,
    hash: string
): BreadcrumbCrumb[] {
    for (const node of nodes) {
        const trail = findTrailInNode(node, pathname, hash, true);
        if (trail) return trail;
    }

    for (const node of nodes) {
        const trail = findTrailInNode(node, pathname, hash, false);
        if (trail) return trail;
    }

    return [];
}
