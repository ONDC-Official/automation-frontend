import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DeveloperGuideCollapsedNavBar from "./DeveloperGuideCollapsedNavBar";
import { fetchBuilds } from "@services/developerGuideSpecApi";
import { fetchDocContent, fetchDocList } from "@services/developerDocsApi";
import type { BuildEntry, DocMeta } from "../types";
import { isUseCaseEnabled } from "../utils";
import Spinner from "@/components/Shadcn/Spinner";
import { buildNavTree } from "./buildNavTree";
import { DOCS_WITH_SIDEBAR_SECTIONS } from "./docsWithSidebarSections";
import { filterNavTree } from "./filterNavTree";
import DeveloperGuideSidebar from "./DeveloperGuideSidebar";
import { DeveloperGuideShellContext } from "./DeveloperGuideShellContext";
import { NAV_STATUS_LABEL, NAV_STATUS_STYLES, type NavStatus } from "../shared/statusPlaceholders";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/Shadcn/Button";

const STATUS_LEGEND_ORDER: NavStatus[] = ["released", "drafted", "to-be-deprecated", "deprecated"];

const StatusLegend: FC = () => (
    <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Version status legend">
        {STATUS_LEGEND_ORDER.map((status) => (
            <span
                key={status}
                className={`rounded-full px-2 py-1 text-caption-2-size font-semibold leading-none ${NAV_STATUS_STYLES[status]}`}
            >
                {NAV_STATUS_LABEL[status]}
            </span>
        ))}
    </div>
);

const DeveloperGuideShellMain: FC = () => (
    <main className="flex-1 min-w-0 overflow-y-auto h-full">
        <Outlet />
    </main>
);

const DeveloperGuideShell: FC = () => {
    const { pathname } = useLocation();
    const isGettingStartedRoute = pathname === ROUTES.DEVELOPER_GUIDE_GETTING_STARTED;

    const [builds, setBuilds] = useState<BuildEntry[]>([]);
    const [docs, setDocs] = useState<DocMeta[]>([]);
    const [docMarkdownBySlug, setDocMarkdownBySlug] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [navSidebarOpen, setNavSidebarOpen] = useState(true);

    const toggleNavSidebar = useCallback(() => {
        setNavSidebarOpen((prev) => !prev);
    }, []);

    const openNavSidebar = useCallback(() => {
        setNavSidebarOpen(true);
    }, []);

    const collapseNavSidebar = useCallback(() => {
        setNavSidebarOpen(false);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const [buildsData, docsData] = await Promise.all([
                    fetchBuilds(),
                    fetchDocList().catch(() => [] as DocMeta[]),
                ]);

                const sidebarDocSlugs = docsData
                    .map((d) => d.slug)
                    .filter((slug) => DOCS_WITH_SIDEBAR_SECTIONS.has(slug));

                const sidebarDocContents = await Promise.all(
                    sidebarDocSlugs.map((slug) =>
                        fetchDocContent(slug)
                            .then((content) => [slug, content] as const)
                            .catch(() => null)
                    )
                );

                if (!cancelled) {
                    setBuilds(buildsData);
                    setDocs(docsData);
                    setDocMarkdownBySlug(
                        Object.fromEntries(
                            sidebarDocContents.filter(
                                (entry): entry is readonly [string, string] => entry !== null
                            )
                        )
                    );
                }
            } catch {
                if (!cancelled) {
                    setLoadError("Unable to load navigation. Please try again later.");
                    setBuilds([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const navTree = useMemo(
        () => buildNavTree(builds, docs, isUseCaseEnabled, docMarkdownBySlug),
        [builds, docs, docMarkdownBySlug]
    );

    const filteredNavTree = useMemo(
        () => filterNavTree(navTree, searchQuery),
        [navTree, searchQuery]
    );

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-var(--app-header-height))] flex items-center justify-center bg-white dark:bg-surface-page">
                <Spinner className="size-8 text-brand-normal" />
            </div>
        );
    }

    return (
        <DeveloperGuideShellContext.Provider
            value={{
                inShell: true,
                loadError,
                docs,
                builds,
                navTree,
                navSidebarOpen,
                toggleNavSidebar,
                openNavSidebar,
                collapseNavSidebar,
            }}
        >
            <div className="h-[calc(100vh-var(--app-header-height))] overflow-hidden bg-white dark:bg-surface-page flex flex-col">
                <DeveloperGuideCollapsedNavBar />
                {isGettingStartedRoute && (
                    <div className="flex gap-2 px-6 py-3 bg-alert-50 items-center">
                        <span className="text-alert-500 text-body-1 font-semibold">Tip: </span>
                        <span className="text-body-2 font-regular text-n-300">
                            Use Filter navigation in the sidebar to quickly find a domain, use case,
                            or documentation page.
                        </span>
                    </div>
                )}
                <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
                    <aside
                        className={`shrink-0 border-b lg:border-b-0 bg-slate-100 dark:bg-surface-muted flex min-h-0 flex-col lg:h-full transition-[width] duration-300 ease-in-out overflow-hidden ${
                            navSidebarOpen
                                ? "w-full lg:w-64 xl:w-72"
                                : "hidden lg:block lg:w-0 lg:border-r-0"
                        }`}
                    >
                        <div className="px-4 py-2 pb-5">
                            <div className="flex items-start justify-between gap-2 pt-4">
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
                            <div className="relative mt-4">
                                <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="search"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-surface-elevated border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-500/20 focus:border-sky-300 placeholder-slate-400 text-slate-800 shadow-xs"
                                />
                            </div>
                            <StatusLegend />
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 py-2 pb-8">
                            {loadError ? (
                                <p className="px-2 py-4 text-sm text-red-600 dark:text-red-400">
                                    {loadError}
                                </p>
                            ) : (
                                <DeveloperGuideSidebar
                                    nodes={filteredNavTree}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </div>
                    </aside>

                    <div className="relative flex flex-1 min-w-0 min-h-0 flex-col">
                        <DeveloperGuideShellMain />
                    </div>
                </div>
            </div>
        </DeveloperGuideShellContext.Provider>
    );
};

export default DeveloperGuideShell;
