import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DeveloperGuideCollapsedNavBar from "./DeveloperGuideCollapsedNavBar";
import DeveloperGuideNavBackButton from "./DeveloperGuideNavBackButton";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";
import { filterNavTree } from "./filterNavTree";
import DeveloperGuideSidebar from "./DeveloperGuideSidebar";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    resetDevGuideShell,
    toggleNavSidebar as toggleNavSidebarAction,
} from "@store/slices/devGuideShellSlice";
import { useDevGuideShellServerState } from "@store/selectors/devGuideSelectors";
import { NAV_STATUS_LABEL, NAV_STATUS_STYLES, type NavStatus } from "../shared/statusPlaceholders";
import { Button } from "@components/Shadcn/Button";
import Input from "@components/Shadcn/Input";
import { ROUTES } from "@constants/routes";

const STATUS_LEGEND_ORDER: NavStatus[] = ["released", "drafted", "to-be-deprecated", "deprecated"];

const StatusLegend: FC = () => (
    <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Version status legend">
        {STATUS_LEGEND_ORDER.map((status) => (
            <span
                key={status}
                className={`rounded-full px-2 py-2 text-caption-2-size font-semibold leading-none ${NAV_STATUS_STYLES[status]}`}
            >
                {NAV_STATUS_LABEL[status]}
            </span>
        ))}
    </div>
);

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
        return <LoadingOverlay />;
    }

    return (
        <div className="flex min-h-[calc(100svh-4rem)] flex-col bg-white dark:bg-surface-page">
            <div className="flex flex-1 flex-col lg:flex-row lg:items-start">
                <aside
                    className={`shrink-0 border-b border-n-40 bg-slate-100 dark:border-border-default dark:bg-surface-muted lg:border-b-0 lg:border-r lg:border-n-40 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] ${
                        navSidebarOpen ? "w-full lg:w-72" : "hidden lg:flex lg:w-0 lg:border-r-0"
                    }`}
                >
                    {/* Fixed inner width so content doesn't reflow while the width animates */}
                    <div
                        className={`flex min-h-0 flex-1 flex-col lg:w-72 lg:shrink-0 transition-opacity duration-300 ease-in-out ${
                            navSidebarOpen ? "opacity-100" : "lg:opacity-0"
                        }`}
                    >
                        <div className="shrink-0 px-4 pt-3 pb-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h1 className="text-base font-semibold tracking-tight text-slate-900">
                                        Developer Guide
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        ONDC integration reference
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={toggleNavSidebar}
                                    className="text-brand-normal bg-brand-light hover:bg-brand-light-active hover:text-brand-normal-hover rounded-3xl w-12 h-7 border-n-40"
                                    aria-label="Collapse navigation"
                                    title="Collapse navigation"
                                >
                                    <ArrowLeftIcon className="size-4" aria-hidden />
                                </Button>
                            </div>
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
                            <StatusLegend />
                            {isNavEnriching ? (
                                <p className="mt-2 text-xs text-slate-400">Loading docs…</p>
                            ) : null}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-10 scrollbar-none">
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
                    </div>
                </aside>

                <div className="relative flex min-w-0 flex-1 flex-col">
                    <DeveloperGuideCollapsedNavBar />
                    {!navSidebarOpen && (
                        <div className="absolute left-0 top-0 z-30 flex h-11 min-h-11 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                            <DeveloperGuideNavBackButton className="rounded-l-none" />
                        </div>
                    )}
                    <DeveloperGuideShellMain />
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideShell;
