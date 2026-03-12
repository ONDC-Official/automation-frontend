import { FC, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft } from "react-icons/fa";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";
import IconButton from "@components/ui/mini-components/icon-button";
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

    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [domainResponse, setDomainResponse] = useState<DomainResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

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

        const firstStep = matchingFlow.steps?.[0];
        if (firstStep) {
            setSelectedFlowAction(getActionId(firstStep));
        } else {
            setSelectedFlowAction("");
        }
        setNotFound(false);
    }, [isLoading, domainResponse, domainKey, versionKey, slug, flows]);

    const handleBack = () => {
        navigate(ROUTES.DEVELOPER_GUIDE);
    };

    const usecaseLabel = useMemo(() => {
        if (!domainResponse) return null;
        return getUsecaseLabelFromSlug(domainResponse, domainKey, versionKey, slug);
    }, [domainResponse, domainKey, versionKey, slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader />
            </div>
        );
    }

    if (notFound || !domainKey || !versionKey || !slug) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
                <p className="text-gray-600 mb-4">Use case not found for this domain/version.</p>
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                >
                    Back to Developer Guide
                </button>
            </div>
        );
    }

    return (
        <div className="relative bg-slate-50/50">
            <header className="flex items-center justify-between px-6 bg-gradient-to-r from-white to-sky-50 border-b border-sky-100 shadow-sm py-4">
                <div className="flex items-center gap-6">
                    <IconButton
                        icon={<FaArrowLeft size={16} />}
                        label="Back"
                        onClick={handleBack}
                        color="gray"
                    />
                    <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                        DEVELOPER GUIDE
                    </span>
                </div>
                {usecaseLabel && (
                    <div className="hidden md:flex items-center gap-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                            <span className="text-gray-500">Domain:</span>
                            <span className="font-semibold text-gray-800">{domainKey}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                            <span className="text-gray-500">Use Case:</span>
                            <span className="font-semibold text-gray-800">{usecaseLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                            <span className="text-gray-500">Version:</span>
                            <span className="font-semibold text-gray-800">{versionKey}</span>
                        </div>
                    </div>
                )}
            </header>

            <div className="flex flex-1 overflow-hidden px-6 py-6 gap-0">
                <div
                    className={`relative flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                        sidebarOpen ? "w-[380px]" : "w-0"
                    }`}
                >
                    <aside className="w-[380px] h-full border-r border-slate-200 bg-white overflow-y-auto rounded-2xl shadow-lg shadow-sky-100/50">
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

                <div className="flex-shrink-0 flex items-start pt-4 z-10">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95 ${
                            sidebarOpen
                                ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white border border-slate-200 shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-md"
                                : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-md shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300"
                        }`}
                    >
                        <FaChevronLeft
                            className={`transition-transform duration-300 text-[9px] ${
                                sidebarOpen
                                    ? "text-slate-400 group-hover:text-sky-500"
                                    : "text-white rotate-180"
                            }`}
                        />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-w-0 pl-4">
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
