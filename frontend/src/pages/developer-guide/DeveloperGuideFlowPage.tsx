import { FC, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    FiArrowLeft,
    FiChevronRight,
    FiChevronLeft,
    FiList,
    FiAlertTriangle,
    FiZap,
    FiFileText,
    FiClock,
} from "react-icons/fi";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import Loader from "@components/ui/mini-components/loader";
import { fetchBuilds, fetchSpec, fetchDocs, fetchChangelog } from "@services/developerGuideSpecApi";
import { getActionId, getUsecaseLabelFromBuilds } from "./utils";
import { ROUTES } from "@constants/routes";
import { SegmentedTabs } from "@components/ui/SegmentedTabs";
import DocsViewer from "./DocsViewer";
import ErrorCodesTable from "./ErrorCodesTable";
import SupportedActionsView from "./SupportedActionsView";
import ChangelogView from "./ChangelogView";
import type { OpenAPISpecification, FlowEntry, BuildEntry, ChangelogEntry } from "./types";

type TopLevelView = "flows" | "error-codes" | "supported-actions" | "docs" | "changelog";

const DeveloperGuideFlowPage: FC = () => {
    const {
        domain: domainParam,
        version: versionParam,
        useCase: useCaseSlug,
    } = useParams<{
        domain: string;
        version: string;
        useCase: string;
    }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeView, setActiveView] = useState<TopLevelView>("flows");
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [builds, setBuilds] = useState<BuildEntry[]>([]);
    const [specData, setSpecData] = useState<OpenAPISpecification | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Lazy load states
    const [lazyDocs, setLazyDocs] = useState<Record<string, string> | null>(null);
    const [docsLoading, setDocsLoading] = useState(false);
    const [lazyChangelog, setLazyChangelog] = useState<ChangelogEntry[] | null>(null);
    const [changelogLoading, setChangelogLoading] = useState(false);

    const docsFetched = useRef(false);
    const changelogFetched = useRef(false);
    const didInitialSync = useRef(false);

    const domainKey = domainParam != null ? decodeURIComponent(domainParam) : "";
    const versionKey = versionParam != null ? decodeURIComponent(versionParam) : "";
    const slug = useCaseSlug ? decodeURIComponent(useCaseSlug) : "";

    const flows: FlowEntry[] = useMemo(() => specData?.["x-flows"] ?? [], [specData]);
    const errorCodes = specData?.["x-errorcodes"];
    const supportedActions = specData?.["x-supported-actions"];
    const hasErrorCodes = !!errorCodes?.code?.length;
    const hasSupportedActions =
        !!supportedActions && Object.keys(supportedActions.supportedActions ?? {}).length > 0;

    // Load builds + spec data
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setNotFound(false);
            try {
                const [buildsData, spec] = await Promise.all([
                    fetchBuilds(),
                    domainKey && versionKey
                        ? fetchSpec(domainKey, versionKey, {
                              include: ["meta", "flows", "attributes", "validations"],
                              usecase: slug || undefined,
                          })
                        : null,
                ]);
                if (cancelled) return;
                setBuilds(buildsData);
                if (spec) {
                    setSpecData(spec);
                } else {
                    setNotFound(true);
                }
            } catch {
                if (!cancelled) {
                    setBuilds([]);
                    setNotFound(true);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [domainKey, versionKey, slug]);

    // Initial sync of TopLevelView from searchParams — runs once on mount only.
    // IMPORTANT: Only read from `view=` param, never from `tab=` (that's used
    // internally by FlowInformation for preview/request/response tabs).
    useEffect(() => {
        const viewParam = searchParams.get("view");
        const validViews: TopLevelView[] = [
            "flows",
            "error-codes",
            "supported-actions",
            "docs",
            "changelog",
        ];
        if (viewParam && validViews.includes(viewParam as TopLevelView)) {
            setActiveView(viewParam as TopLevelView);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    // Lazy load Docs
    const loadDocsIfNeeded = useCallback(() => {
        if (docsFetched.current || !domainKey || !versionKey) return;
        docsFetched.current = true;
        setDocsLoading(true);
        fetchDocs(domainKey, versionKey)
            .then((result) => setLazyDocs(result))
            .catch(() => setLazyDocs({}))
            .finally(() => setDocsLoading(false));
    }, [domainKey, versionKey]);

    // Lazy load Changelog
    const loadChangelogIfNeeded = useCallback(() => {
        if (changelogFetched.current || !domainKey || !versionKey) return;
        changelogFetched.current = true;
        setChangelogLoading(true);
        fetchChangelog(domainKey, versionKey)
            .then((result) => setLazyChangelog(result))
            .catch(() => setLazyChangelog(null))
            .finally(() => setChangelogLoading(false));
    }, [domainKey, versionKey]);

    // Trigger lazy loads when active view changes
    useEffect(() => {
        if (activeView === "docs") loadDocsIfNeeded();
        if (activeView === "changelog") loadChangelogIfNeeded();
    }, [activeView, loadDocsIfNeeded, loadChangelogIfNeeded]);

    // Sync flow/action selection strictly for the Flows tab interior
    useEffect(() => {
        if (isLoading || !specData || flows.length === 0) return;

        const matchingFlow = flows.find((f) => f.usecase === slug) ?? flows[0];
        if (!matchingFlow) return;

        const flowId = matchingFlow.flowId;
        setSelectedFlow(flowId);

        const urlAction = searchParams.get("action");
        const steps = matchingFlow.config?.steps ?? [];
        const urlStep = urlAction ? steps.find((s) => getActionId(s) === urlAction) : undefined;
        const targetStep = urlStep ?? steps[0];
        const resolvedAction = targetStep ? getActionId(targetStep) : "";

        setSelectedFlowAction(resolvedAction || "");

        // Initial setup for URL
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("flow", flowId);
                if (resolvedAction) next.set("action", resolvedAction);
                else next.delete("action");
                return next;
            },
            { replace: true }
        );

        didInitialSync.current = true;
    }, [isLoading, specData, flows, slug]);

    // Keep URL in sync when user navigates via sidebar inside Flows tab
    useEffect(() => {
        if (!didInitialSync.current) return;
        if (!selectedFlow) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("flow", selectedFlow);
                if (selectedFlowAction) next.set("action", selectedFlowAction);
                else next.delete("action");
                return next;
            },
            { replace: true }
        );
    }, [selectedFlow, selectedFlowAction, setSearchParams]);

    const handleBack = () => {
        navigate(ROUTES.DEVELOPER_GUIDE);
    };

    const handleViewChange = (view: TopLevelView) => {
        setActiveView(view);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("view", view);
                return next;
            },
            { replace: true }
        );
    };

    const usecaseLabel = useMemo(() => {
        if (!builds.length) return null;
        return getUsecaseLabelFromBuilds(builds, domainKey, versionKey, slug);
    }, [builds, domainKey, versionKey, slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader />
            </div>
        );
    }

    if (notFound || !domainKey || !versionKey || !slug) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
                <p className="text-gray-600 mb-4">Use case not found for this domain/version.</p>
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium"
                >
                    Back to Developer Guide
                </button>
            </div>
        );
    }

    // Determine Docs data
    const docs = lazyDocs ?? specData?.["x-docs"];
    const isDocsEmpty = !docs || Object.keys(docs).length === 0;

    return (
        <div className="relative bg-white min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="px-6 h-14 flex items-center justify-between gap-4">
                    <nav className="flex items-center gap-1.5 text-sm min-w-0">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-sky-600 transition-colors duration-150 group flex-shrink-0"
                        >
                            <FiArrowLeft
                                size={13}
                                className="group-hover:-translate-x-0.5 transition-transform duration-150"
                            />
                            <span>Developer Guide</span>
                        </button>
                        {usecaseLabel && (
                            <>
                                <FiChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                                <span className="text-gray-400 truncate hidden sm:block">
                                    {domainKey}
                                </span>
                                <FiChevronRight
                                    size={13}
                                    className="text-gray-300 flex-shrink-0 hidden sm:block"
                                />
                                <span className="font-semibold text-gray-800 truncate">
                                    {usecaseLabel}
                                </span>
                            </>
                        )}
                    </nav>
                    {versionKey && (
                        <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-semibold">
                            v{versionKey}
                        </span>
                    )}
                </div>

                {/* Top Level Nav Tabs */}
                <div className="px-6 pt-3 pb-2 bg-white shadow-sm flex items-center justify-end">
                    <SegmentedTabs<TopLevelView>
                        active={activeView}
                        onChange={handleViewChange}
                        tabs={[
                            { id: "flows", label: "Flows", icon: FiList, visible: true },
                            {
                                id: "error-codes",
                                label: "Error Codes",
                                icon: FiAlertTriangle,
                                visible: hasErrorCodes,
                            },
                            {
                                id: "supported-actions",
                                label: "Actions",
                                icon: FiZap,
                                visible: hasSupportedActions,
                            },
                            { id: "docs", label: "Docs", icon: FiFileText, visible: true },
                            { id: "changelog", label: "Changelog", icon: FiClock, visible: true },
                        ]}
                    />
                </div>
            </header>

            <div className="flex-grow flex items-start gap-0 relative">
                {activeView === "flows" ? (
                    <>
                        {/* Sidebar strictly for Flows */}
                        <div
                            className={`sticky top-24 self-start flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                                sidebarOpen ? "w-[380px]" : "w-0"
                            }`}
                        >
                            <aside className="w-[380px] h-[calc(100vh-6rem)] border-r border-slate-200 bg-white overflow-y-auto rounded-none shadow-[2px_0_10px_0_rgba(0,0,0,0.02)]">
                                <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Flows</h2>
                                    <p className="text-gray-600 text-sm">
                                        Explore the configured protocol flows
                                    </p>
                                </div>
                                <div className="p-5 pt-3">
                                    <FlowsAccordion
                                        flows={flows}
                                        selectedFlow={selectedFlow}
                                        selectedFlowAction={selectedFlowAction}
                                        setSelectedFlow={setSelectedFlow}
                                        setSelectedFlowAction={setSelectedFlowAction}
                                    />
                                </div>
                            </aside>
                        </div>

                        <div className="sticky top-[10rem] self-start flex-shrink-0 flex items-start pt-4 z-10">
                            <button
                                onClick={() => setSidebarOpen((prev) => !prev)}
                                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95 ${
                                    sidebarOpen
                                        ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white border border-gray-200 shadow-sm hover:bg-sky-50 hover:border-sky-300"
                                        : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.5)] hover:bg-sky-600 hover:-translate-y-0.5"
                                }`}
                            >
                                <FiChevronLeft
                                    size={10}
                                    className={`transition-transform duration-300 ${
                                        sidebarOpen
                                            ? "text-gray-400 group-hover:text-sky-500"
                                            : "text-white rotate-180"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex-1 min-w-0 px-4">
                            {specData && flows.length > 0 ? (
                                <FlowInformation
                                    data={specData}
                                    flows={flows}
                                    selectedFlow={selectedFlow}
                                    selectedFlowAction={selectedFlowAction}
                                    domain={domainKey}
                                    version={versionKey}
                                />
                            ) : (
                                <div className="w-full flex items-center justify-center min-h-[50vh]">
                                    <p className="text-slate-500 font-medium">
                                        No flows available for this use case.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Content area for Non-Flow top-level tabs */
                    <div className="flex-1 min-w-0 p-8 max-w-9xl mx-auto w-full">
                        {activeView === "error-codes" &&
                            (hasErrorCodes && errorCodes ? (
                                <ErrorCodesTable errorCodes={errorCodes} />
                            ) : (
                                <p className="text-slate-500 text-center py-12">
                                    No error codes available.
                                </p>
                            ))}
                        {activeView === "supported-actions" &&
                            (hasSupportedActions && supportedActions ? (
                                <SupportedActionsView supportedActions={supportedActions} />
                            ) : (
                                <p className="text-slate-500 text-center py-12">
                                    No actions available.
                                </p>
                            ))}
                        {activeView === "docs" &&
                            (docsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader />
                                </div>
                            ) : isDocsEmpty ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 text-center">
                                    <p className="text-sm text-slate-400">
                                        No documentation available.
                                    </p>
                                </div>
                            ) : (
                                <DocsViewer docs={docs} />
                            ))}
                        {activeView === "changelog" &&
                            (changelogLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader />
                                </div>
                            ) : (
                                <ChangelogView changelogs={lazyChangelog || []} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeveloperGuideFlowPage;
