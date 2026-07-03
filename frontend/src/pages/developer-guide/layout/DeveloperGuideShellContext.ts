import { useCallback } from "react";
import type { BuildEntry, DocMeta } from "../types";
import type { NavNode } from "./navTypes";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    setNavSidebarOpen,
    toggleNavSidebar as toggleNavSidebarAction,
} from "@store/slices/devGuideShellSlice";

export interface DeveloperGuideShellContextValue {
    inShell: boolean;
    loadError: string | null;
    docs: DocMeta[];
    builds: BuildEntry[];
    navTree: NavNode[];
    navSidebarOpen: boolean;
    toggleNavSidebar: () => void;
    openNavSidebar: () => void;
    collapseNavSidebar: () => void;
}

/**
 * Reads Developer Guide shell state from the Redux `devGuideShell` slice. State (including
 * server-fetched docs/builds/navTree, which are populated by the shell's own fetch effect) lives in
 * the store; this hook preserves the previous Context API for all consumers.
 */
export function useDeveloperGuideShell(): DeveloperGuideShellContextValue {
    const dispatch = useAppDispatch();
    const { inShell, loadError, docs, builds, navTree, navSidebarOpen } = useAppSelector(
        (state) => state.devGuideShell
    );

    const toggleNavSidebar = useCallback(() => dispatch(toggleNavSidebarAction()), [dispatch]);
    const openNavSidebar = useCallback(() => dispatch(setNavSidebarOpen(true)), [dispatch]);
    const collapseNavSidebar = useCallback(() => dispatch(setNavSidebarOpen(false)), [dispatch]);

    return {
        inShell,
        loadError,
        docs,
        builds,
        navTree,
        navSidebarOpen,
        toggleNavSidebar,
        openNavSidebar,
        collapseNavSidebar,
    };
}
