import { useCallback } from "react";
import { useMatch } from "react-router-dom";
import { ROUTES } from "@constants/routes";
import type { BuildEntry, DocMeta } from "../types";
import type { NavNode } from "./navTypes";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { useDevGuideShellServerState } from "@store/selectors/devGuideSelectors";
import {
    setNavSidebarOpen,
    toggleNavSidebar as toggleNavSidebarAction,
} from "@store/slices/devGuideShellSlice";

export interface DeveloperGuideNavValue {
    inShell: boolean;
    navSidebarOpen: boolean;
    toggleNavSidebar: () => void;
    openNavSidebar: () => void;
}

/**
 * Lightweight Developer Guide nav-shell UI state: sidebar open/close + `inShell` route flag.
 * Reads ONLY the `devGuideShell` slice — no server data, no nav-tree computation. Use this in
 * components that just need the sidebar toggle (nav rows, back button, collapsed bar, doc content),
 * so they don't subscribe to the docs/builds queries or rebuild the nav tree on every render.
 */
export function useDeveloperGuideNav(): DeveloperGuideNavValue {
    const dispatch = useAppDispatch();
    const navSidebarOpen = useAppSelector((state) => state.devGuideShell.navSidebarOpen);
    const inShell = Boolean(useMatch({ path: ROUTES.DEVELOPER_GUIDE, end: false }));

    const toggleNavSidebar = useCallback(() => dispatch(toggleNavSidebarAction()), [dispatch]);
    const openNavSidebar = useCallback(() => dispatch(setNavSidebarOpen(true)), [dispatch]);

    return { inShell, navSidebarOpen, toggleNavSidebar, openNavSidebar };
}

export interface DeveloperGuideShellContextValue extends DeveloperGuideNavValue {
    loadError: string | null;
    docs: DocMeta[];
    builds: BuildEntry[];
    navTree: NavNode[];
}

/**
 * Full Developer Guide shell state: nav UI + server data (builds/docs/navTree) from RTK Query
 * caches. Use only in components that actually need the server data (sidebar tree, breadcrumb,
 * general/domains content) — most components should use {@link useDeveloperGuideNav} instead.
 */
export function useDeveloperGuideShell(): DeveloperGuideShellContextValue {
    const nav = useDeveloperGuideNav();
    const { builds, docs, navTree, loadError } = useDevGuideShellServerState();

    return {
        ...nav,
        loadError,
        docs,
        builds,
        navTree,
    };
}
