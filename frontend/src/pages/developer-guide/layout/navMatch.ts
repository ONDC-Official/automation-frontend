import type { NavNode } from "./navTypes";

export function parseNavPath(path: string): { pathname: string; hash: string } {
    const hashIndex = path.indexOf("#");
    if (hashIndex === -1) return { pathname: path, hash: "" };
    return {
        pathname: path.slice(0, hashIndex),
        hash: path.slice(hashIndex),
    };
}

export function isNavLinkActive(
    node: Extract<NavNode, { type: "link" }>,
    pathname: string,
    hash: string
): boolean {
    if (node.disabled) return false;

    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path);

    if (node.id === "overview") {
        return pathname === linkPath || pathname === `${linkPath}/`;
    }

    if (linkHash) {
        return pathname === linkPath && hash === linkHash;
    }

    return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
}

export function isNavGroupPathActive(
    node: Extract<NavNode, { type: "group" }>,
    pathname: string,
    hash: string
): boolean {
    if (!node.path) return false;

    const { pathname: linkPath, hash: linkHash } = parseNavPath(node.path);
    if (node.id === "general-docs" || node.id === "domains") {
        return pathname === linkPath || pathname === `${linkPath}/`;
    }

    if (linkHash) {
        return pathname === linkPath && hash === linkHash;
    }

    return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
}
