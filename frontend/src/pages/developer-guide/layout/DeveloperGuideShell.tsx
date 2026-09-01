import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { DeveloperGuideNavSidebarToggle } from "./DeveloperGuideNavSidebarToggle";
import { filterNavTree } from "./filterNavTree";
import DeveloperGuideSidebar from "./DeveloperGuideSidebar";
import DeveloperGuidePageSkeleton from "./DeveloperGuidePageSkeleton";
import VersionStatusLegend from "./VersionStatusLegend";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    resetDevGuideShell,
    toggleNavSidebar as toggleNavSidebarAction,
} from "@store/slices/devGuideShellSlice";
import { useDevGuideShellServerState } from "@store/selectors/devGuideSelectors";
import Input from "@components/Shadcn/Input";
import { ROUTES } from "@constants/routes";

const DeveloperGuideShellMain: FC = () => (
    <main className="flex-1 min-w-0">
        <Outlet />
    </main>
);

const DeveloperGuideShell: FC = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navSidebarOpen = useAppSelector((state) => state.devGuideShell.navSidebarOpen);
    const toggleNavSidebar = useCallback(() => dispatch(toggleNavSidebarAction()), [dispatch]);
    const { navTree, isLoading, loadError, isNavEnriching } = useDevGuideShellServerState();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        return () => {
            dispatch(resetDevGuideShell());
        };
    }, [dispatch]);

    const filteredNavTree = useMemo(
        () => filterNavTree(navTree, searchQuery),
        [navTree, searchQuery]
    );

    // The bare `/developer-guide` index route immediately client-redirects to Getting Started
    // (see Routes/index.tsx) via <Navigate>, whose effect only fires after the first paint —
    // and only once <Outlet> has actually rendered it, so <Outlet> must keep rendering
    // unconditionally here or the redirect can never fire. Mounting the *sidebar* for that
    // instantaneous pathname would show every section collapsed for one frame before the
    // redirect flips it open, so only the sidebar tree is held back until it resolves.
    const isPendingIndexRedirect =
        (location.pathname === ROUTES.DEVELOPER_GUIDE ||
            location.pathname === `${ROUTES.DEVELOPER_GUIDE}/`) &&
        !location.hash;

    if (isLoading) {
        return <DeveloperGuidePageSkeleton />;
    }

    return (
        <div className="flex min-h-[calc(100svh-4rem)] flex-col bg-white dark:bg-surface-page">
            <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
                <aside
                    className={`shrink-0 border-b border-n-40 dark:border-border-default lg:border-b-0 lg:border-r lg:border-n-40 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] ${
                        navSidebarOpen ? "w-full lg:w-72" : "w-full lg:w-11"
                    }`}
                >
                    {navSidebarOpen ? (
                        /* Fixed inner width so content doesn't reflow while the width animates */
                        <div className="flex min-h-0 flex-1 flex-col lg:w-72 lg:shrink-0">
                            <div className="shrink-0">
                                <div className="flex h-11 min-h-11 items-center justify-between border-b border-slate-200 px-4 dark:border-border-default">
                                    <h1 className="truncate text-sm font-medium text-slate-700 dark:text-slate-800">
                                        Developer Guide
                                    </h1>
                                    <DeveloperGuideNavSidebarToggle
                                        sidebarOpen
                                        onClick={toggleNavSidebar}
                                    />
                                </div>
                                <div className="px-4 pt-3 pb-0">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        ONDC integration reference
                                    </p>
                                    <div className="relative mt-3">
                                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-900 dark:text-neutral-400 pointer-events-none" />
                                        <Input
                                            type="search"
                                            placeholder="Search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-elevated border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20 focus:border-sky-300 placeholder-slate-400 text-slate-800 shadow-xs [&::-webkit-search-cancel-button]:cursor-pointer"
                                        />
                                    </div>
                                    {isNavEnriching ? (
                                        <p className="mt-2 text-xs text-slate-400">Loading docs…</p>
                                    ) : null}
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-4 scrollbar-none">
                                {loadError ? (
                                    <p className="px-2 py-4 text-sm text-red-600 dark:text-red-400">
                                        {loadError}
                                    </p>
                                ) : isPendingIndexRedirect ? null : (
                                    <DeveloperGuideSidebar
                                        nodes={filteredNavTree}
                                        searchQuery={searchQuery}
                                    />
                                )}
                            </div>
                            <VersionStatusLegend />
                        </div>
                    ) : (
                        <div className="flex h-11 min-h-11 shrink-0 items-center border-b border-slate-200 px-4 lg:h-auto lg:min-h-0 lg:w-full lg:flex-1 lg:items-start lg:justify-center lg:border-b-0 lg:px-0 lg:pt-3 dark:border-border-default">
                            <DeveloperGuideNavSidebarToggle
                                sidebarOpen={false}
                                onClick={toggleNavSidebar}
                            />
                        </div>
                    )}
                </aside>

                <DeveloperGuideShellMain />
            </div>
        </div>
    );
};

export default DeveloperGuideShell;
