import type { IFlowActionButtonProps } from "./types";
import {
    PlayCircleIcon as PlayCircleOutlineIcon,
    StopCircleIcon as StopCircleOutlineIcon,
    ArchiveBoxIcon as ArchiveBoxOutlineIcon,
    ArrowDownCircleIcon as ArrowDownCircleOutlineIcon,
} from "@heroicons/react/24/outline";
import {
    PlayCircleIcon as PlayCircleSolidIcon,
    StopCircleIcon as StopCircleSolidIcon,
    ArchiveBoxIcon as ArchiveBoxSolidIcon,
    ArrowDownCircleIcon as ArrowDownCircleSolidIcon,
} from "@heroicons/react/24/solid";
import type { FilteredDifficultyCache } from "./types";

export const POLL_INTERVAL = 5000;
export const POLL_TIMEOUT = 90000;
export const REPORT_POLL_DELAY_MS = 30000;
export const TRACKED_TAGS = ["REPORTABLE", "MANDATORY", "OPTIONAL"] as const;

export const SESSION_SIDE_PANEL_MAX_HEIGHT = "600px";

export const FAQ_ITEMS = [
    {
        id: "faq1",
        question: 'What does "Waiting" status mean?',
        answer: 'The "Waiting" status indicates that this API is expecting you to send a request to the specified endpoint. The flow will not proceed until this request is made.',
    },
    {
        id: "faq2",
        question: "Why can't I use the same transaction_id for different flows?",
        answer: "Each flow represents a unique transaction. Using the same transaction_id would cause conflicts and make it impossible to distinguish between different flow executions. Always use a unique transaction_id for each new flow.",
    },
    {
        id: "faq3",
        question: "What happens to my data when I delete a flow?",
        answer: "Deleting a flow permanently removes all associated data, including requests, responses, and metadata. This action cannot be undone. If you need to retry, you must start with a new, different transaction_id.",
    },
    {
        id: "faq4",
        question: "When should APIs have the same message_id?",
        answer: "APIs should share the same message_id only when they are displayed as pairs (typically a request-response pair). All other APIs in your flow should have unique message_ids to maintain proper tracking.",
    },
    {
        id: "faq5",
        question: "Can I start a new flow without stopping the current one?",
        answer: "No, you must manually stop the current flow before starting a new one. This ensures data integrity and prevents conflicts between concurrent flows.",
    },
    {
        id: "faq6",
        question: "How do I disable validations?",
        answer: "Click the settings icon in the Info section, then adjust validation options and click Save.",
    },
    {
        id: "faq7",
        question: "When can I generate a report?",
        answer: "You can generate a report at any point during or after flow execution. The report will contain all available data up to that moment and will automatically open in a new view.",
    },
] as const;

export const INFO_LABELS: Record<string, string> = {
    sessionId: "Session ID",
    subscriberType: "Subscriber Type",
    domain: "Domain",
    version: "Version",
    use_case: "Use Case",
    env: "Environment",
    activeFlow: "ActiveFlow",
};

export const COPYABLE_INFO_KEYS = new Set(["sessionId", "subscriberUrl"]);

export const REPORT_INFO_LABELS: Record<string, string> = {
    domain: "Domain",
    usecaseId: "Usecase",
    version: "Version",
    npType: "NP Type",
    env: "Environment",
};

export const keyDetailsMapping: Record<string, { label: string; info: string }> = {
    stopAfterFirstNack: {
        label: "Stop At Nack",
        info: "Stops execution after the first NACK response is received.",
    },
    timeValidations: {
        label: "Time Validation",
        info: "Checks whether request and response timestamps are valid.",
    },
    protocolValidations: {
        label: "Protocol Validation",
        info: "Validates payloads against protocol-level schema and rules.",
    },
    useGateway: {
        label: "Use Gateway",
        info: "Routes requests through gateway before reaching target participants.",
    },
    headerValidaton: {
        label: "Header Validation",
        info: "Verifies required request headers and their expected values.",
    },
    useGzip: {
        label: "Use Gzip",
        info: "Enables gzip compression for payload transfer.",
    },
    encryptionValidation: {
        label: "Encryption Validation",
        info: "Validates encryption-related fields and expected encrypted values.",
    },
    useCare: {
        label: "Use Care(IGM)",
        info: "Enables IGM care flow specific checks for supported scenarios.",
    },
    useTunnelForFIS: {
        label: "Use Tunnel(FIS)",
        info: "Uses the FIS tunnel path for request/response execution.",
    },
    totalDifficulty: {
        label: "Total Difficulty",
        info: "Represents combined score based on enabled difficulty settings.",
    },
};

export const SESSION_VALIDATION_DEFAULTS: FilteredDifficultyCache = {
    protocolValidations: true,
    useGateway: true,
    headerValidaton: true,
    useGzip: false,
    encryptionValidation: false,
    useCare: false,
    useTunnelForFIS: false,
};

export const SKIP_DIFFICULTY_ITEMS = ["stopAfterFirstNack", "sensitiveTTL", "timeValidations"];

export const FLOW_ACTION_VARIANT_STYLES: Record<IFlowActionButtonProps["variant"], string> = {
    play: "bg-brand-light text-brand-normal hover:!bg-brand-light hover:!text-brand-normal hover:opacity-80 dark:bg-brand-dark/30 dark:hover:!bg-brand-dark/30 dark:hover:!text-brand-normal",
    stop: "bg-error-50 text-error-500 hover:!bg-error-50 hover:!text-error-500 hover:opacity-80 dark:bg-error-500/15 dark:hover:!bg-error-500/15 dark:hover:!text-error-500",
    delete: "bg-error-50 text-error-500 hover:!bg-error-50 hover:!text-error-500 hover:opacity-80 dark:bg-error-500/15 dark:hover:!bg-error-500/15 dark:hover:!text-error-500",
    download:
        "bg-success-50 text-success-500 hover:!bg-success-50 hover:!text-success-500 hover:opacity-80 dark:bg-success-800/20 dark:hover:!bg-success-800/20 dark:hover:!text-success-500",
};

type VariantIcon = typeof PlayCircleSolidIcon;

export const FLOW_ACTION_SOLID_ICONS: Record<IFlowActionButtonProps["variant"], VariantIcon> = {
    play: PlayCircleSolidIcon,
    stop: StopCircleSolidIcon,
    delete: ArchiveBoxSolidIcon,
    download: ArrowDownCircleSolidIcon,
};

export const FLOW_ACTION_OUTLINE_ICONS: Record<IFlowActionButtonProps["variant"], VariantIcon> = {
    play: PlayCircleOutlineIcon,
    stop: StopCircleOutlineIcon,
    delete: ArchiveBoxOutlineIcon,
    download: ArrowDownCircleOutlineIcon,
};

/** Legacy modal overlay classes for Shadcn Dialog parity */
export const FLOW_DIALOG_OVERLAY_CLASS = "bg-black/40 backdrop-blur-xs";
