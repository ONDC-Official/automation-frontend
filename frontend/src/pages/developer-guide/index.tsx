import { FC, useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaChevronLeft } from "react-icons/fa";
import FlowsAccordion from "./FlowsAccordion";
import FlowInformation from "./FlowInformation";
import data from "./data.json";
import IconButton from "@components/ui/mini-components/icon-button";
import Modal from "@components/Modal";
import Loader from "@components/ui/mini-components/loader";
import { fetchFormFieldData } from "@utils/request-utils";
import type { DomainItem, DomainResponse } from "@pages/home/types";
import { getActionId } from "./utils";

const DeveloperGuide: FC = () => {
    const [selectedFlow, setSelectedFlow] = useState<string>("");
    const [selectedFlowAction, setSelectedFlowAction] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(true);
    const [activeDomain, setActiveDomain] = useState<DomainResponse>({ domain: [] });
    const [isLoadingDomains, setIsLoadingDomains] = useState(false);
    const [domainsError, setDomainsError] = useState<string | null>(null);
    const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>("ONDC:FIS12");
    const [selectedVersionKey, setSelectedVersionKey] = useState<string | null>("2.0.3");
    const [selectedUsecaseLabel, setSelectedUsecaseLabel] = useState<string | null>(
        "Personal Loan"
    );

    const flows = useMemo(() => data["x-flows"] || [], []);

    const handleUsecaseSelect = (
        domain: DomainItem,
        versionKey: string,
        usecaseLabel: string,
        shouldCloseDialog = true
    ) => {
        // Currently only ONDC:FIS12 domain flows are enabled
        const isEnabledDomain = domain.key.toUpperCase() === "ONDC:FIS12";
        if (!isEnabledDomain) return;

        setSelectedDomainKey(domain.key);
        setSelectedVersionKey(versionKey);
        setSelectedUsecaseLabel(usecaseLabel);

        const usecaseSlug = usecaseLabel
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        const matchingFlow =
            flows.find((flow) => {
                const meta = flow.meta ?? {};
                const domainMeta = String(meta.domain ?? "");
                const versionMeta = String(meta.version ?? "");
                const usecaseMeta = String(meta.use_case_id ?? "");

                const matchesDomain =
                    domainMeta === domain.key ||
                    domainMeta.endsWith(`:${domain.key}`) ||
                    domainMeta.includes(domain.key);

                const matchesVersion = !versionKey || versionMeta === versionKey;
                const matchesUsecase = !usecaseSlug || usecaseMeta === usecaseSlug;

                return matchesDomain && matchesVersion && matchesUsecase;
            }) ??
            // Fallback: match only on usecase id
            flows.find((flow) => {
                const meta = flow.meta ?? {};
                const usecaseMeta = String(meta.use_case_id ?? "");
                return usecaseMeta === usecaseSlug;
            });

        if (!matchingFlow) return;

        const flowId = String(matchingFlow.meta?.flowId ?? "");
        setSelectedFlow(flowId);

        const firstStep = matchingFlow.steps?.[0];
        if (firstStep) {
            const firstActionId = getActionId(firstStep);
            setSelectedFlowAction(firstActionId);
        } else {
            setSelectedFlowAction("");
        }

        if (shouldCloseDialog) {
            setIsDomainDialogOpen(false);
        }
    };

    useEffect(() => {
        const loadDomains = async () => {
            setIsLoadingDomains(true);
            setDomainsError(null);
            try {
                const response = await fetchFormFieldData();
                if (response && typeof response === "object" && "domain" in response) {
                    const domainResponse = response as DomainResponse;
                    setActiveDomain(domainResponse);

                    // Set default selection: ONDC:FIS12 / Personal Loan (2.0.3)
                    const defaultDomainKey = "ONDC:FIS12";
                    const defaultVersionKey = "2.0.3";
                    const defaultUsecaseLabel = "Personal Loan";

                    const defaultDomain = domainResponse.domain.find(
                        (d) => d.key === defaultDomainKey
                    );
                    const defaultVersion = defaultDomain?.version?.find(
                        (v) => v.key === defaultVersionKey
                    );
                    const hasDefaultUsecase =
                        defaultVersion?.usecase?.includes(defaultUsecaseLabel);

                    if (defaultDomain && defaultVersion && hasDefaultUsecase) {
                        handleUsecaseSelect(
                            defaultDomain,
                            defaultVersionKey,
                            defaultUsecaseLabel,
                            false
                        );
                    }
                } else {
                    setActiveDomain({ domain: [] });
                }
            } catch {
                setDomainsError("Unable to load domains. Please try again later.");
                setActiveDomain({ domain: [] });
            } finally {
                setIsLoadingDomains(false);
            }
        };

        loadDomains();
    }, []);

    const handleBack = () => {
        // Open domain/use case selection dialog instead of navigating away
        setIsDomainDialogOpen(true);
    };

    return (
        <div className="relative bg-slate-50/50">
            {isLoadingDomains && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-50/80 transition-opacity duration-300">
                    <Loader />
                </div>
            )}

            {!isLoadingDomains && (
                <Modal
                    isOpen={isDomainDialogOpen}
                    onClose={() => {
                        setIsDomainDialogOpen(false);
                    }}
                    fullWidth
                    className="max-w-6xl max-h-[90vh] transition-opacity duration-300 ease-out"
                >
                    <div className="space-y-4 max-h-[82vh] overflow-hidden">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Select a use case</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Choose a domain and use case to load its flow in the developer
                                guide.
                            </p>

                            {selectedDomainKey && selectedUsecaseLabel && selectedVersionKey && (
                                <div className="hidden md:flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                        <span className="text-gray-500">Domain:</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedDomainKey}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                        <span className="text-gray-500">Use Case:</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedUsecaseLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                        <span className="text-gray-500">Version:</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedVersionKey}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {domainsError ? (
                            <p className="text-sm text-red-600">{domainsError}</p>
                        ) : activeDomain.domain.length === 0 ? (
                            <p className="text-sm text-gray-500">No domains available.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pt-1 pr-1">
                                {activeDomain.domain.map((dom, domIndex) => {
                                    const isEnabledDomain = dom.key.toUpperCase() === "ONDC:FIS12";
                                    const totalUseCases = (dom.version ?? []).reduce(
                                        (total, ver) => total + (ver.usecase?.length ?? 0),
                                        0
                                    );

                                    return (
                                        <div
                                            key={dom.id ?? `${dom.key}-${domIndex}`}
                                            className={`rounded-2xl border p-4 bg-white shadow-sm flex flex-col gap-3 ${
                                                isEnabledDomain
                                                    ? "border-sky-200 hover:border-sky-300 hover:shadow-md transition"
                                                    : "border-slate-200/70 opacity-70 cursor-not-allowed"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-gray-900">
                                                        {dom.key}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {totalUseCases} use cases
                                                    </p>
                                                </div>
                                                {!isEnabledDomain && (
                                                    <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                                        Coming soon
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-nowrap gap-2 mt-1 overflow-x-auto pb-1">
                                                {dom.version?.map((ver) =>
                                                    ver.usecase?.map((uc) => {
                                                        const isEnabled = isEnabledDomain;
                                                        const isSelected =
                                                            isEnabled &&
                                                            selectedDomainKey === dom.key &&
                                                            selectedVersionKey === ver.key &&
                                                            selectedUsecaseLabel === uc;
                                                        return (
                                                            <button
                                                                key={`${dom.key}-${ver.key}-${uc}`}
                                                                type="button"
                                                                disabled={!isEnabled}
                                                                onClick={() =>
                                                                    handleUsecaseSelect(
                                                                        dom,
                                                                        ver.key,
                                                                        uc
                                                                    )
                                                                }
                                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                                                                    isEnabled
                                                                        ? isSelected
                                                                            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                                                            : "bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 hover:border-sky-400"
                                                                        : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                {uc}
                                                                {ver.key && (
                                                                    <span className="ml-1.5 text-[10px] text-sky-700">
                                                                        ({ver.key})
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
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
                {!isDomainDialogOpen &&
                    selectedDomainKey &&
                    selectedUsecaseLabel &&
                    selectedVersionKey && (
                        <div className="hidden md:flex items-center gap-3 text-sm text-slate-700">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                <span className="text-gray-500">Domain:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedDomainKey}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                <span className="text-gray-500">Use Case:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedUsecaseLabel}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-sky-100">
                                <span className="text-gray-500">Version:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedVersionKey}
                                </span>
                            </div>
                        </div>
                    )}
            </header>
            <div className="flex flex-1 overflow-hidden px-6 py-6 gap-0">
                {/* ── Collapsible sidebar wrapper ── */}
                <div
                    className={`relative flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                        sidebarOpen ? "w-[380px]" : "w-0"
                    }`}
                >
                    <aside className="w-[380px] h-full border-r border-slate-200 bg-white overflow-y-auto rounded-2xl shadow-lg shadow-sky-100/50">
                        <div className="px-4 pt-4 pb-2 border-b border-slate-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Flows</h2>
                            <p className="text-gray-600 text-sm">
                                Explore the configured protocol flows
                            </p>
                        </div>
                        <div className="p-4 pt-3">
                            <FlowsAccordion
                                data={data}
                                selectedFlow={selectedFlow}
                                selectedFlowAction={selectedFlowAction}
                                setSelectedFlow={setSelectedFlow}
                                setSelectedFlowAction={setSelectedFlowAction}
                            />
                        </div>
                    </aside>
                </div>

                {/* ── Sidebar toggle tab ── */}
                <div className="flex-shrink-0 flex items-start pt-4 z-10">
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={`group flex items-center justify-center h-12 transition-all duration-200 active:scale-95
                            ${
                                sidebarOpen
                                    ? "w-5 -ml-px rounded-r-lg border-l-0 bg-white border border-slate-200 shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-md"
                                    : "w-8 rounded-lg bg-sky-500 border border-sky-600 shadow-md shadow-sky-200 hover:bg-sky-600 hover:shadow-sky-300"
                            }`}
                    >
                        <FaChevronLeft
                            className={`transition-transform duration-300 text-[9px]
                                ${
                                    sidebarOpen
                                        ? "text-slate-400 group-hover:text-sky-500"
                                        : "text-white rotate-180"
                                }`}
                        />
                    </button>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 overflow-y-auto min-w-0 pl-4">
                    <FlowInformation
                        data={data}
                        selectedFlow={selectedFlow}
                        selectedFlowAction={selectedFlowAction}
                    />
                </div>
            </div>
        </div>
    );
};
export default DeveloperGuide;
