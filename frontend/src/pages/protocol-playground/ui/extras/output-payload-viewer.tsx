import {
    CSSProperties,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { toast } from "sonner";
import Markdown from "react-markdown";
import axios from "axios";
import {
    MockRunner,
    ExecutionResult,
    MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";
import { Editor } from "@monaco-editor/react";

import { fetchFormFieldData } from "@utils/request-utils";

import {
    IoCheckmarkCircle,
    IoCloseCircle,
    IoChevronDown,
    IoChevronUp,
    IoCodeSlash,
    IoShieldCheckmark,
    IoPlayCircle,
    IoAlertCircle,
    IoTerminal,
    IoDocumentText,
    IoClose,
    IoPencil,
    IoRefresh,
} from "react-icons/io5";

import { useAppliedTheme } from "@/context/theme/useAppliedTheme";
import { cn } from "@/lib/utils";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { buildLinearConfig } from "@pages/protocol-playground/utils/transaction-view";
import {
    IActiveDomainConfig,
    IDomain,
    IDomainVersion,
    IParsedPayload,
} from "@pages/schema-validation/types";

/**
 * Type for ONDC protocol payload
 * Can be an empty string or a parsed payload object with context
 */
type ProtocolPayload = "" | IParsedPayload | Record<string, unknown>;

// ─── Validate Requirements Modal ──────────────────────────────────────────────

interface ValidateReqsModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionId: string | undefined;
    config: MockPlaygroundConfigType | undefined;
    onResult: (result: { valid: boolean; code: number; description: string }) => void;
    setActiveTerminalData: React.Dispatch<React.SetStateAction<ExecutionResult[]>>;
}

function ValidateRequirementsModal({
    isOpen,
    onClose,
    actionId,
    config,
    onResult,
    setActiveTerminalData,
}: ValidateReqsModalProps) {
    const [sessionJson, setSessionJson] = useState("{}");
    const [loadingSession, setLoadingSession] = useState(false);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<{
        valid: boolean;
        code: number;
        description: string;
    } | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    const fetchSession = useCallback(async () => {
        if (!config) return;
        setLoadingSession(true);
        setResult(null);
        setJsonError(null);
        hasFetched.current = true;
        try {
            const runner = new MockRunner(config as MockPlaygroundConfigType);
            const steps = config.steps;
            const index = steps.findIndex((s) => s.action_id === actionId);
            const data = await runner.getSessionDataUpToStep(index >= 0 ? index : 0);
            setSessionJson(JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("Error fetching session data", e);
            toast.error("Failed to fetch session data");
            setSessionJson("{}");
        } finally {
            setLoadingSession(false);
        }
    }, [config, actionId]);

    useEffect(() => {
        if (isOpen && !hasFetched.current) {
            fetchSession();
        }
        if (!isOpen) {
            hasFetched.current = false;
            setResult(null);
            setJsonError(null);
        }
    }, [isOpen, fetchSession]);

    const handleValidate = async () => {
        if (!config) {
            toast.error("No configuration found");
            return;
        }
        let parsedSession: Record<string, unknown>;
        try {
            parsedSession = JSON.parse(sessionJson);
        } catch {
            setJsonError("Invalid JSON — please fix the session data before running validation.");
            return;
        }
        setJsonError(null);
        setValidating(true);
        setResult(null);
        try {
            const runner = new MockRunner(config);
            runner.logger.setLogLevel(3);
            const execResult = await runner.runMeetRequirementsWithSession(
                actionId || "",
                parsedSession
            );
            setActiveTerminalData((s) => [...s, execResult]);
            setResult(execResult.result);
            onResult(execResult.result);
        } catch (e) {
            console.error("Error running meet requirements", e);
            toast.error("Validation failed — check console for details.");
        } finally {
            setValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                style={{ width: "min(820px, 95vw)", maxHeight: "90vh" }}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-indigo-600 to-sky-500">
                    <div className="flex items-center gap-3">
                        <IoPencil className="text-white text-xl" />
                        <div>
                            <h2 className="text-white font-bold text-base leading-tight">
                                Validate Requirements
                            </h2>
                            <p className="text-indigo-100 text-xs mt-0.5">
                                Edit the live session data below, then run validation against&nbsp;
                                <span className="font-mono bg-white/20 px-1 rounded">
                                    {actionId || "unknown"}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                hasFetched.current = false;
                                fetchSession();
                            }}
                            disabled={loadingSession}
                            title="Refresh session data"
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition disabled:opacity-50"
                        >
                            <IoRefresh
                                className={`text-lg ${loadingSession ? "animate-spin" : ""}`}
                            />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition"
                        >
                            <IoClose className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Session Data Editor */}
                <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
                    <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                        <IoCodeSlash className="text-sky-500 text-sm" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Live Session Data
                        </span>
                        {loadingSession && (
                            <span className="ml-auto flex items-center gap-1.5 text-xs text-sky-600">
                                <span className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin inline-block" />
                                Loading…
                            </span>
                        )}
                    </div>

                    <div style={{ flex: "1 1 320px", minHeight: "260px" }}>
                        <Editor
                            height="100%"
                            language="json"
                            theme="vs-dark"
                            value={sessionJson}
                            onChange={(v) => setSessionJson(v ?? "{}")}
                            options={{
                                fontSize: 13,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                formatOnPaste: true,
                                padding: { top: 12, bottom: 12 },
                                lineNumbers: "on",
                            }}
                        />
                    </div>

                    {/* JSON parse error */}
                    {jsonError && (
                        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-start gap-2">
                            <IoAlertCircle className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700">{jsonError}</p>
                        </div>
                    )}
                </div>

                {/* Result Banner */}
                {result && (
                    <div
                        className={`px-6 py-3 flex items-start gap-3 border-t ${
                            result.valid
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                        }`}
                    >
                        {result.valid ? (
                            <IoCheckmarkCircle className="text-green-500 text-2xl shrink-0 mt-0.5" />
                        ) : (
                            <IoCloseCircle className="text-red-500 text-2xl shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className={`text-sm font-semibold ${
                                        result.valid ? "text-green-700" : "text-red-700"
                                    }`}
                                >
                                    {result.valid ? "Requirements Met" : "Requirements Not Met"}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                                        result.code === 200
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-red-100 text-red-800 border border-red-200"
                                    }`}
                                >
                                    {result.code}
                                </span>
                            </div>
                            <p
                                className={`text-xs mt-1 ${result.valid ? "text-green-600" : "text-red-600"}`}
                            >
                                {result.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleValidate}
                        disabled={validating || loadingSession}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-xs"
                    >
                        {validating ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Validating…
                            </>
                        ) : (
                            <>
                                <IoShieldCheckmark className="text-base" />
                                Run Validation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OutputPayloadViewer({
    payload: propPayload,
    runs,
    actionId,
}: {
    payload: ProtocolPayload;
    runs?: ProtocolPayload[];
    actionId: string | undefined;
}) {
    // Extra steps run multiple times — `runs` holds every recorded run.
    // Default to the latest; let the user page back through earlier runs.
    const [selectedRun, setSelectedRun] = useState<number>(runs ? runs.length - 1 : 0);
    useEffect(() => {
        setSelectedRun(runs ? runs.length - 1 : 0);
    }, [actionId, runs?.length]);

    const hasRuns = !!runs && runs.length > 0;
    const runIndex = hasRuns ? Math.min(selectedRun, runs.length - 1) : 0;
    // The payload shown / validated is the selected run (or the single payload).
    const payload = hasRuns ? (runs[runIndex] ?? propPayload) : propPayload;
    const [activeDomain, setActiveDomain] = useState<IActiveDomainConfig>({});
    const [mdData, setMdData] = useState("");
    const [loading, setIsLoading] = useState(false);
    const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

    // Section toggles
    const [showPayload, setShowPayload] = useState(true);
    const [showValidation, setShowValidation] = useState(true);
    const [showL2Results, setShowL2Results] = useState(true);

    // Validate Requirements modal
    const [reqsModalOpen, setReqsModalOpen] = useState(false);

    const playgroundContext = useContext(PlaygroundContext);
    const appliedTheme = useAppliedTheme();
    const jsonTheme = useMemo(
        () => (appliedTheme === "dark" ? githubDarkTheme : githubLightTheme),
        [appliedTheme]
    );
    const [l2Result, setL2Result] = useState<
        | {
              valid: boolean;
              code: number;
              description: string;
          }
        | undefined
    >(undefined);
    // Track which button produced the current l2Result
    const [l2ResultSource, setL2ResultSource] = useState<"l2" | "requirements">("l2");

    useEffect(() => {
        const getFormFields = async () => {
            const data = await fetchFormFieldData();
            setActiveDomain(data as IActiveDomainConfig);
        };
        getFormFields();
    }, []);

    const verifyRequestL0 = async () => {
        if (payload === "") {
            toast.warning("Add payload for the request");
            return;
        }

        // After empty string check, payload is ParsedPayload | Record<string, unknown>
        const parsedPayload = payload as IParsedPayload | Record<string, unknown>;

        try {
            if (Array.isArray(parsedPayload)) {
                toast.warning("Array of payloads not supported");
                return;
            }
        } catch (e) {
            console.error("error while parsing ", e);
            toast.error("Invalid payload");
            return;
        }

        // Type guard: check if payload has context property
        const payloadWithContext = parsedPayload as IParsedPayload;
        const action = payloadWithContext?.context?.action;

        if (!action) {
            toast.warning("action missing from context");

            return;
        }

        let isDomainActive = false;

        Object.entries(activeDomain).forEach((data: [string, IDomain[]]) => {
            const [_key, domains] = data;

            domains.forEach((domain: IDomain) => {
                if (domain.key === payloadWithContext?.context?.domain) {
                    domain.version.forEach((ver: IDomainVersion) => {
                        if (
                            ver.key ===
                            (payloadWithContext?.context?.version ||
                                payloadWithContext?.context?.core_version)
                        ) {
                            isDomainActive = true;
                        }
                    });
                }
            });
        });

        if (!isDomainActive) {
            toast.warning(
                "Domain or version not yet active. To check the list of active domain visit home page."
            );
            return;
        }

        setMdData("");
        setValidationSuccess(null);
        setShowValidation(true);

        try {
            setIsLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
                parsedPayload
            );
            setMdData(response.data?.error?.message || "✓ Validation passed successfully");
            setValidationSuccess(response.data?.error ? false : true);
        } catch (e) {
            console.error(">>>>>", e);
            toast.error("Something went wrong");
            setValidationSuccess(false);
            setMdData("Validation failed due to server error");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyRequestL2 = async () => {
        setIsLoading(true);
        try {
            const config = playgroundContext.config;
            if (!config) {
                toast.error("No configuration found");
                setIsLoading(false);
                return;
            }
            // Linear view: history & steps aligned across both groups + retriggers.
            const runner = new MockRunner(buildLinearConfig(config));
            runner.logger.setLogLevel(3);
            const l2Result = await runner.runValidatePayload(actionId || "", payload);
            playgroundContext.setActiveTerminalData((s) => [...s, l2Result]);
            setL2ResultSource("l2");
            setL2Result(l2Result.result);
        } catch (e) {
            console.error("error in l2", e);
        }
        setIsLoading(false);
    };

    const verifyRequestMeetReqs = () => {
        // Open the modal — session data is fetched inside the modal on open
        setReqsModalOpen(true);
    };

    if (!payload || !actionId) {
        return (
            <div className="mt-2 flex h-full items-center justify-center rounded-lg border border-border-default bg-surface-muted">
                <div className="p-8 text-center">
                    <IoDocumentText className="mx-auto mb-3 text-5xl text-text-secondary" />
                    <p className="text-sm font-medium text-text-secondary">No payload available</p>
                    <p className="mt-1 text-xs text-text-secondary/80">
                        Execute a function to see the output
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-surface-elevated shadow-xs">
            {/* Validate Requirements Modal */}
            <ValidateRequirementsModal
                isOpen={reqsModalOpen}
                onClose={() => setReqsModalOpen(false)}
                actionId={actionId}
                config={playgroundContext.config}
                setActiveTerminalData={playgroundContext.setActiveTerminalData}
                onResult={(res) => {
                    setL2ResultSource("requirements");
                    setL2Result(res);
                }}
            />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-default bg-brand-light px-4 py-3 dark:bg-surface-muted">
                <div className="flex items-center gap-2">
                    <IoTerminal className="text-xl text-brand-normal" />
                    <h3 className="text-base font-semibold text-text-primary">Output Payload</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={verifyRequestL0}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-xs"
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <IoShieldCheckmark className="text-base" />
                                <span>L1 Validation</span>
                            </>
                        )}
                    </button>
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-xs"
                        onClick={verifyRequestL2}
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <IoShieldCheckmark className="text-base" />
                                <span>L2 Validation</span>
                            </>
                        )}
                    </button>

                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-xs"
                        onClick={verifyRequestMeetReqs}
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <IoShieldCheckmark className="text-base" />
                                <span>Validate Requirements</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Payload Section */}
                <div className="border-b border-border-default">
                    <button
                        onClick={() => setShowPayload(!showPayload)}
                        className="flex w-full items-center justify-between bg-surface-muted p-3 text-left transition hover:bg-brand-light dark:hover:bg-surface-muted/80"
                    >
                        <div className="flex items-center gap-2">
                            <IoCodeSlash className="text-base text-brand-normal" />
                            <span className="text-sm font-semibold text-text-primary">
                                Payload Data
                            </span>
                            {hasRuns && runs.length > 1 && (
                                <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-normal dark:bg-surface-elevated dark:text-text-secondary">
                                    {runs.length} runs
                                </span>
                            )}
                        </div>
                        {showPayload ? (
                            <IoChevronUp className="text-text-secondary" />
                        ) : (
                            <IoChevronDown className="text-text-secondary" />
                        )}
                    </button>
                    {showPayload && (
                        <div className="bg-surface-elevated p-4">
                            {hasRuns && runs.length > 1 && (
                                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                    {runs.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedRun(i)}
                                            className={cn(
                                                "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                                                i === runIndex
                                                    ? "bg-brand-normal text-n-0 shadow-xs"
                                                    : "bg-surface-muted text-text-secondary hover:bg-brand-light dark:hover:bg-surface-muted/80"
                                            )}
                                        >
                                            Run {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="overflow-hidden rounded-lg border border-border-default bg-surface-muted p-2">
                                <JsonView
                                    value={payload}
                                    collapsed={1}
                                    style={jsonTheme as CSSProperties}
                                    displayDataTypes={false}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* L1 Validation Results Section */}
                {mdData && (
                    <div className="border-b border-border-default">
                        <button
                            onClick={() => setShowValidation(!showValidation)}
                            className={cn(
                                "flex w-full items-center justify-between p-3 text-left transition",
                                validationSuccess === false
                                    ? "bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                                    : validationSuccess === true
                                      ? "bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/15"
                                      : "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/15"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {validationSuccess === false ? (
                                    <IoCloseCircle className="text-red-500 text-base" />
                                ) : validationSuccess === true ? (
                                    <IoCheckmarkCircle className="text-green-500 text-base" />
                                ) : (
                                    <IoAlertCircle className="text-yellow-500 text-base" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm font-semibold",
                                        validationSuccess === false
                                            ? "text-red-700 dark:text-red-400"
                                            : validationSuccess === true
                                              ? "text-green-700 dark:text-green-400"
                                              : "text-yellow-700 dark:text-yellow-400"
                                    )}
                                >
                                    L1 Validation Results
                                </span>
                                {validationSuccess !== null && (
                                    <span
                                        className={cn(
                                            "rounded px-2 py-0.5 text-xs font-medium",
                                            validationSuccess
                                                ? "border border-green-200 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
                                                : "border border-red-200 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                                        )}
                                    >
                                        {validationSuccess ? "Passed" : "Failed"}
                                    </span>
                                )}
                            </div>
                            {showValidation ? (
                                <IoChevronUp
                                    className={
                                        validationSuccess === false
                                            ? "text-red-400"
                                            : validationSuccess === true
                                              ? "text-green-400"
                                              : "text-yellow-400"
                                    }
                                />
                            ) : (
                                <IoChevronDown
                                    className={
                                        validationSuccess === false
                                            ? "text-red-400"
                                            : validationSuccess === true
                                              ? "text-green-400"
                                              : "text-yellow-400"
                                    }
                                />
                            )}
                        </button>
                        {showValidation && (
                            <div className="prose prose-sm max-w-none bg-surface-elevated p-4 text-text-primary">
                                <Markdown
                                    components={{
                                        a: ({
                                            href,
                                            children,
                                        }: {
                                            href?: string;
                                            children?: React.ReactNode;
                                        }) => (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 underline hover:text-sky-700 transition-colors duration-200 font-medium"
                                            >
                                                {children}
                                            </a>
                                        ),
                                        blockquote: ({
                                            children,
                                        }: {
                                            children?: React.ReactNode;
                                        }) => (
                                            <blockquote className="border-l-4 border-sky-500 bg-sky-50 pl-4 pr-4 py-3 my-3 italic text-gray-700 rounded-r">
                                                {children}
                                            </blockquote>
                                        ),
                                        ul: ({ children }: { children?: React.ReactNode }) => (
                                            <ul className="list-disc pl-5 space-y-1.5 my-3 text-sm">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }: { children?: React.ReactNode }) => (
                                            <ol className="list-decimal pl-5 space-y-1.5 my-3 text-sm">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }: { children?: React.ReactNode }) => (
                                            <li className="leading-relaxed text-text-primary">
                                                {children}
                                            </li>
                                        ),
                                        code: ({
                                            inline,
                                            children,
                                        }: {
                                            inline?: boolean;
                                            children?: React.ReactNode;
                                        }) =>
                                            inline ? (
                                                <code className="bg-red-100 text-red-800 px-1.5 py-0.5 text-xs font-mono rounded border border-red-200">
                                                    {children}
                                                </code>
                                            ) : (
                                                <pre className="bg-gray-900 text-gray-100 p-3 my-3 overflow-x-auto rounded border border-gray-700 text-xs">
                                                    <code className="font-mono">{children}</code>
                                                </pre>
                                            ),
                                        p: ({ children }: { children?: React.ReactNode }) => (
                                            <p className="mb-2 text-sm leading-relaxed text-text-primary">
                                                {children}
                                            </p>
                                        ),
                                        h3: ({ children }: { children?: React.ReactNode }) => (
                                            <h3 className="mt-4 mb-2 border-b border-border-default pb-1 text-base font-semibold text-text-primary">
                                                {children}
                                            </h3>
                                        ),
                                        h4: ({ children }: { children?: React.ReactNode }) => (
                                            <h4 className="mt-3 mb-2 text-sm font-semibold text-text-primary">
                                                {children}
                                            </h4>
                                        ),
                                        h5: ({ children }: { children?: React.ReactNode }) => (
                                            <h5 className="mt-2 mb-1.5 text-xs font-semibold text-text-secondary">
                                                {children}
                                            </h5>
                                        ),
                                        strong: ({ children }: { children?: React.ReactNode }) => (
                                            <strong className="font-semibold text-text-primary">
                                                {children}
                                            </strong>
                                        ),
                                        em: ({ children }: { children?: React.ReactNode }) => (
                                            <em className="text-text-secondary italic">
                                                {children}
                                            </em>
                                        ),
                                        hr: () => <hr className="my-4 border-border-default" />,
                                        table: ({ children }: { children?: React.ReactNode }) => (
                                            <div className="overflow-x-auto my-3">
                                                <table className="min-w-full divide-y divide-gray-300 text-xs border border-gray-300">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ children }: { children?: React.ReactNode }) => (
                                            <thead className="bg-surface-muted">{children}</thead>
                                        ),
                                        tbody: ({ children }: { children?: React.ReactNode }) => (
                                            <tbody className="divide-y divide-border-default bg-surface-elevated">
                                                {children}
                                            </tbody>
                                        ),
                                        tr: ({ children }: { children?: React.ReactNode }) => (
                                            <tr>{children}</tr>
                                        ),
                                        th: ({ children }: { children?: React.ReactNode }) => (
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children }: { children?: React.ReactNode }) => (
                                            <td className="px-3 py-2 text-xs text-text-secondary">
                                                {children}
                                            </td>
                                        ),
                                    }}
                                >
                                    {mdData}
                                </Markdown>
                            </div>
                        )}
                    </div>
                )}

                {/* L2 Validation Results Section */}
                {l2Result && (
                    <div className="border-b border-border-default">
                        <button
                            onClick={() => setShowL2Results(!showL2Results)}
                            className={cn(
                                "flex w-full items-center justify-between p-3 text-left transition",
                                !l2Result.valid
                                    ? "bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/15"
                                    : "bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/15"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {!l2Result.valid ? (
                                    <IoCloseCircle className="text-red-500 text-base" />
                                ) : (
                                    <IoCheckmarkCircle className="text-green-500 text-base" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm font-semibold",
                                        !l2Result.valid
                                            ? "text-red-700 dark:text-red-400"
                                            : "text-green-700 dark:text-green-400"
                                    )}
                                >
                                    {l2ResultSource === "requirements"
                                        ? "Validate Meet Requirements"
                                        : "L2 Validation Results"}
                                </span>
                                <span
                                    className={cn(
                                        "rounded px-2 py-0.5 text-xs font-medium",
                                        l2Result.valid
                                            ? "border border-green-200 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
                                            : "border border-red-200 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                                    )}
                                >
                                    {l2Result.valid ? "Passed" : "Failed"}
                                </span>
                            </div>
                            {showL2Results ? (
                                <IoChevronUp
                                    className={!l2Result.valid ? "text-red-400" : "text-green-400"}
                                />
                            ) : (
                                <IoChevronDown
                                    className={!l2Result.valid ? "text-red-400" : "text-green-400"}
                                />
                            )}
                        </button>
                        {showL2Results && (
                            <div className="bg-surface-elevated p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-secondary">
                                            Status Code:
                                        </span>
                                        <span
                                            className={cn(
                                                "rounded px-2 py-1 font-mono text-xs",
                                                l2Result.code === 200
                                                    ? "border border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
                                                    : "border border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                                            )}
                                        >
                                            {l2Result.code}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="mb-1 block text-sm font-medium text-text-secondary">
                                            Description:
                                        </span>
                                        <p className="rounded border border-border-default bg-surface-muted p-3 text-sm text-text-primary">
                                            {l2Result.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state when no validation run yet */}
                {!mdData && !loading && (
                    <div className="p-8 text-center">
                        <IoPlayCircle className="mx-auto mb-3 text-5xl text-text-secondary/50" />
                        <p className="text-sm font-medium text-text-secondary">Ready to validate</p>
                        <p className="mt-1 text-xs text-text-secondary/80">
                            Click "L1 Validation" to run validation checks
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
