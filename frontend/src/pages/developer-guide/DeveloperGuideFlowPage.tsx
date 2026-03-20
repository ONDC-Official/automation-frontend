import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";
import Loader from "@components/ui/mini-components/loader";
import { fetchFormFieldData } from "@utils/request-utils";
import type { DomainResponse } from "@pages/home/types";
import { getActionId, getUsecaseLabelFromSlug } from "./utils";
import { ROUTES } from "@constants/routes";
import type { OpenAPISpecification } from "./types";

const specData = data as OpenAPISpecification;

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

    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [domainResponse, setDomainResponse] = useState<DomainResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Becomes true once the initial URL-restore effect has written ?flow= & ?action=.
    // The watcher below only fires *after* that, so it never interferes with initial load.
    const didInitialSync = useRef(false);

    const flows = useMemo(() => specData["x-flows"] ?? [], []);

    const domainKey = domainParam != null ? decodeURIComponent(domainParam) : "";
    const versionKey = versionParam != null ? decodeURIComponent(versionParam) : "";
    const slug = useCaseSlug ?? "";

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setNotFound(false);
            try {
                const response = await fetchFormFieldData();
                if (response && typeof response === "object" && "domain" in response) {
                    setDomainResponse(response as DomainResponse);
                } else {
                    setDomainResponse({ domain: [] });
                }
            } catch {
                setDomainResponse({ domain: [] });
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (isLoading || !domainResponse || !domainKey || !versionKey || !slug) {
            if (!domainKey && !versionKey && !slug) return;
            if (!isLoading && domainResponse && (domainKey || versionKey || slug)) {
                const hasMatch =
                    domainResponse.domain.some((d) => d.key === domainKey) &&
                    getUsecaseLabelFromSlug(domainResponse, domainKey, versionKey, slug);
                if (!hasMatch) setNotFound(true);
            }
            return;
        }

        const usecaseLabel = getUsecaseLabelFromSlug(domainResponse, domainKey, versionKey, slug);
        if (!usecaseLabel) {
            setNotFound(true);
            return;
        }

        const matchingFlow =
            flows.find((flow) => {
                const meta = flow.meta ?? {};
                const domainMeta = String(meta.domain ?? "");
                const versionMeta = String(meta.version ?? "");
                const usecaseMeta = String(meta.use_case_id ?? "");

                const matchesDomain =
                    domainMeta === domainKey ||
                    domainMeta.endsWith(`:${domainKey}`) ||
                    domainMeta.includes(domainKey);
                const matchesVersion = !versionKey || versionMeta === versionKey;
                const matchesUsecase = usecaseMeta === slug;

                return matchesDomain && matchesVersion && matchesUsecase;
            }) ??
            flows.find((flow) => {
                const meta = flow.meta ?? {};
                return String(meta.use_case_id ?? "") === slug;
            });

        if (!matchingFlow) {
            setNotFound(true);
            return;
        }

        const flowId = String(matchingFlow.meta?.flowId ?? "");
        setSelectedFlow(flowId);

        // Prefer ?action= URL param if it refers to a valid step in this flow
        const urlAction = searchParams.get("action");
        const urlStep = urlAction
            ? matchingFlow.steps?.find((s) => getActionId(s) === urlAction)
            : undefined;
        const targetStep = urlStep ?? matchingFlow.steps?.[0];
        const resolvedAction = targetStep ? getActionId(targetStep) : "";

        if (resolvedAction) {
            setSelectedFlowAction(resolvedAction);
        } else {
            setSelectedFlowAction("");
        }

        // Sync resolved values to URL (replace so back-button isn't polluted)
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
        setNotFound(false);
    }, [isLoading, domainResponse, domainKey, versionKey, slug, flows]);

    // Atomic watcher: when the user navigates to a different flow or action via the sidebar,
    // both state values are batched into one render, so this effect always sees the final pair
    // and writes them in a single setSearchParams call — fixing the race where two separate
    // setSearchParams calls both read the same stale `prev`.
    useEffect(() => {
        if (!didInitialSync.current) return;
        if (!selectedFlow) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("flow", selectedFlow);
                if (selectedFlowAction) next.set("action", selectedFlowAction);
                else next.delete("action");
                next.delete("tab");
                next.delete("attr");
                next.delete("panel");
                return next;
            },
            { replace: true }
        );
    }, [selectedFlow, selectedFlowAction]);

    const handleBack = () => {
        navigate(ROUTES.DEVELOPER_GUIDE);
    };

    const usecaseLabel = useMemo(() => {
        if (!domainResponse) return null;
        return getUsecaseLabelFromSlug(domainResponse, domainKey, versionKey, slug);
    }, [domainResponse, domainKey, versionKey, slug]);

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

    return (
        <div className="relative bg-white min-h-screen">
            {/* ── Header ── */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="px-6 h-14 flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
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
                    {/* Version badge */}
                    {versionKey && (
                        <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-semibold">
                            v{versionKey}
                        </span>
                    )}
                </div>
            </header>

            <div className="flex items-start px-6 py-6 gap-0">
                <div
                    className={`sticky top-0 self-start flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                        sidebarOpen ? "w-[380px]" : "w-0"
                    }`}
                >
                    <aside className="w-[380px] h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white overflow-y-auto rounded-2xl shadow-lg shadow-sky-100/50">
                        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Flows</h2>
                            <p className="text-gray-600 text-sm">
                                Explore the configured protocol flows
                            </p>
                        </div>
                        <div className="p-4 pt-3">
                            <FlowsAccordion
                                data={specData}
                                selectedFlow={selectedFlow}
                                selectedFlowAction={selectedFlowAction}
                                setSelectedFlow={setSelectedFlow}
                                setSelectedFlowAction={setSelectedFlowAction}
                            />
                        </div>
                    </aside>
                </div>

                <div className="sticky top-0 self-start flex-shrink-0 flex items-start pt-4 z-10">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95 ${
                            sidebarOpen
                                ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white border border-gray-200 shadow-sm hover:bg-sky-50 hover:border-sky-300"
                                : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-md shadow-sky-200 hover:bg-sky-600"
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

                <div className="flex-1 min-w-0 pl-4">
                    <FlowInformation
                        data={specData}
                        selectedFlow={selectedFlow}
                        selectedFlowAction={selectedFlowAction}
                    />
                </div>
            </div>
        </div>
    );
};

export default DeveloperGuideFlowPage;
