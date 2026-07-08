import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import {
    MockRunner,
    ExecutionResult,
    MockPlaygroundConfigType,
} from "@ondc/automation-mock-runner";

import { useGetScenarioFormDataQuery, useValidateActionMutation } from "@store/api";

import {
    ArrowPathIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CodeBracketIcon,
    CommandLineIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    PencilSquareIcon,
    PlayCircleIcon,
    ShieldCheckIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";
import AppJsonViewer from "@/components/AppJsonViewer";
import { CodeEditor } from "@/components/PayloadEditor";
import { Button } from "@/components/Shadcn/Button/button";
import Spinner from "@/components/Shadcn/Spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { usePlayground } from "@pages/protocol-playground/hooks/playground-runtime";
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[80vh] max-h-[720px] w-[min(820px,95vw)] max-w-none flex-col gap-0 overflow-hidden p-0"
            >
                {/* Modal Header */}
                <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border-default bg-brand-light px-6 py-4 dark:bg-surface-muted">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-normal/10 text-brand-normal">
                            <PencilSquareIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle>Validate Requirements</DialogTitle>
                            <DialogDescription className="mt-0.5">
                                Edit the live session data below, then run validation against&nbsp;
                                <span className="rounded bg-surface-muted px-1 font-mono text-text-primary dark:bg-surface-page">
                                    {actionId || "unknown"}
                                </span>
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                                hasFetched.current = false;
                                fetchSession();
                            }}
                            disabled={loadingSession}
                            title="Refresh session data"
                            className="text-text-secondary"
                        >
                            <ArrowPathIcon
                                className={cn("size-5", loadingSession && "animate-spin")}
                            />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onClose}
                            title="Close"
                            className="text-text-secondary"
                        >
                            <XMarkIcon className="size-5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Session Data Editor */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border-default bg-surface-muted px-4 py-2">
                        <CodeBracketIcon className="size-3.5 text-brand-normal" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Live Session Data
                        </span>
                        {loadingSession && (
                            <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-normal">
                                <Spinner className="size-3" />
                                Loading…
                            </span>
                        )}
                    </div>

                    <div className="min-h-0 flex-1">
                        <CodeEditor
                            editorKey="validate-reqs-session-editor"
                            value={sessionJson}
                            language="json"
                            onChange={(v) => setSessionJson(v ?? "{}")}
                            className="h-full w-full"
                            options={{ fontSize: 13, padding: { top: 12, bottom: 12 } }}
                        />
                    </div>

                    {/* JSON parse error */}
                    {jsonError && (
                        <div className="flex items-start gap-2 border-t border-error-500/30 bg-error-50 px-4 py-2 dark:bg-error-500/10">
                            <ExclamationCircleIcon className="mt-0.5 size-4 shrink-0 text-error-500" />
                            <p className="text-xs text-error-500">{jsonError}</p>
                        </div>
                    )}
                </div>

                {/* Result Banner */}
                {result && (
                    <div
                        className={cn(
                            "flex items-start gap-3 border-t px-6 py-3",
                            result.valid
                                ? "border-green-200 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10"
                                : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                        )}
                    >
                        {result.valid ? (
                            <CheckCircleIcon className="mt-0.5 size-6 shrink-0 text-green-500" />
                        ) : (
                            <XCircleIcon className="mt-0.5 size-6 shrink-0 text-red-500" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={cn(
                                        "text-sm font-semibold",
                                        result.valid
                                            ? "text-green-700 dark:text-green-400"
                                            : "text-red-700 dark:text-red-400"
                                    )}
                                >
                                    {result.valid ? "Requirements Met" : "Requirements Not Met"}
                                </span>
                                <span
                                    className={cn(
                                        "rounded-full border px-2 py-0.5 font-mono text-xs font-medium",
                                        result.code === 200
                                            ? "border-green-200 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
                                            : "border-red-200 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                                    )}
                                >
                                    {result.code}
                                </span>
                            </div>
                            <p
                                className={cn(
                                    "mt-1 text-xs",
                                    result.valid
                                        ? "text-green-600 dark:text-green-400/80"
                                        : "text-red-600 dark:text-red-400/80"
                                )}
                            >
                                {result.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handleValidate}
                        disabled={validating || loadingSession}
                        isLoading={validating}
                    >
                        {validating ? (
                            <>
                                <Spinner className="size-4" />
                                Validating…
                            </>
                        ) : (
                            <>
                                <ShieldCheckIcon className="size-4" />
                                Run Validation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
    const [validateAction] = useValidateActionMutation();
    const [mdData, setMdData] = useState("");
    const [loading, setIsLoading] = useState(false);
    const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);

    // Section toggles
    const [showPayload, setShowPayload] = useState(true);
    const [showValidation, setShowValidation] = useState(true);
    const [showL2Results, setShowL2Results] = useState(true);

    // Validate Requirements modal
    const [reqsModalOpen, setReqsModalOpen] = useState(false);

    const playgroundContext = usePlayground();
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

    const { data: scenarioFormData } = useGetScenarioFormDataQuery();

    useEffect(() => {
        setActiveDomain((scenarioFormData as unknown as IActiveDomainConfig) || {});
    }, [scenarioFormData]);

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
            const response = await validateAction({ action, payload: parsedPayload }).unwrap();
            setMdData(response?.error?.message || "✓ Validation passed successfully");
            setValidationSuccess(response?.error ? false : true);
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
                    <DocumentTextIcon className="mx-auto mb-3 size-12 text-text-secondary" />
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
                    <CommandLineIcon className="size-5 text-brand-normal" />
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
                                <ShieldCheckIcon className="size-4" />
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
                                <ShieldCheckIcon className="size-4" />
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
                                <ShieldCheckIcon className="size-4" />
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
                            <CodeBracketIcon className="size-4 text-brand-normal" />
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
                            <ChevronUpIcon className="size-4 text-text-secondary" />
                        ) : (
                            <ChevronDownIcon className="size-4 text-text-secondary" />
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
                                <AppJsonViewer value={payload} collapsed={1} />
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
                                    <XCircleIcon className="size-4 text-red-500" />
                                ) : validationSuccess === true ? (
                                    <CheckCircleIcon className="size-4 text-green-500" />
                                ) : (
                                    <ExclamationCircleIcon className="size-4 text-yellow-500" />
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
                                <ChevronUpIcon
                                    className={cn(
                                        "size-4",
                                        validationSuccess === false
                                            ? "text-red-400"
                                            : validationSuccess === true
                                              ? "text-green-400"
                                              : "text-yellow-400"
                                    )}
                                />
                            ) : (
                                <ChevronDownIcon
                                    className={cn(
                                        "size-4",
                                        validationSuccess === false
                                            ? "text-red-400"
                                            : validationSuccess === true
                                              ? "text-green-400"
                                              : "text-yellow-400"
                                    )}
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
                                    <XCircleIcon className="size-4 text-red-500" />
                                ) : (
                                    <CheckCircleIcon className="size-4 text-green-500" />
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
                                <ChevronUpIcon
                                    className={cn(
                                        "size-4",
                                        !l2Result.valid ? "text-red-400" : "text-green-400"
                                    )}
                                />
                            ) : (
                                <ChevronDownIcon
                                    className={cn(
                                        "size-4",
                                        !l2Result.valid ? "text-red-400" : "text-green-400"
                                    )}
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
                        <PlayCircleIcon className="mx-auto mb-3 size-12 text-text-secondary/50" />
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
