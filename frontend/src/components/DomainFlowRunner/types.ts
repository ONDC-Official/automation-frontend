import { ReactNode } from "react";
import { Flow } from "@/types/flow-types";
import { SessionCache, SessionPayloadData } from "@/types/session-types";
import type { SessionTab } from "@store/slices/sessionSlice";

export interface IFlowRunAccordionProps {
    flow: Flow;
    activeFlow: string | null;
    setActiveFlow: (flowId: string | null) => void;
    sessionCache?: SessionCache | null;
    sessionId: string;
    setSideView: React.Dispatch<unknown>;
    subUrl: string;
    onFlowStop: () => void;
    /** Optimistically drop local flowMap entry — do not refetch yet. */
    onFlowClear: (flowId: string) => void;
    /** Refetch session after the clear API finishes. */
    onFlowClearSettled: (flowId: string) => void;
}

export interface IRenderFlowsProps {
    flows: Flow[];
    subUrl: string;
    sessionId: string;
    newSession?: () => void;
}

export interface ISessionSidePanelProps {
    sessionData: SessionCache | null;
    requestData: SessionPayloadData;
    responseData: SessionPayloadData;
    selectedTab: SessionTab;
    setSelectedTab: (tab: SessionTab) => void;
    mapEnabled: boolean;
    activeFlowId: string | null;
}

export interface IFlowFiltersPanelProps {
    flowTags: string[];
    selectedTags: string[];
    onSelectedTagsChange: (tags: string[]) => void;
}

export interface ICollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: ReactNode;
    headerActions?: ReactNode;
    className?: string;
}

export interface IInfoPillProps {
    label: string;
    value: string;
    copyable?: boolean;
}

export interface IFlowActionButtonProps {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    variant: "play" | "stop" | "delete" | "download";
    disabled?: boolean;
}

export interface IEndpointsSectionProps {
    sendUrl: string;
    receiveUrl: string;
}

export interface IInfoSectionProps {
    data: Record<string, string>;
    headerActions?: ReactNode;
    pollingIndicator?: ReactNode;
    labels?: Record<string, string>;
    copyableKeys?: Set<string>;
}

export interface DifficultyCache {
    stopAfterFirstNack?: boolean;
    timeValidations: boolean;
    protocolValidations: boolean;
    useGateway: boolean;
    headerValidaton: boolean;
    sensitiveTTL?: boolean;
    useGzip: boolean;
    encryptionValidation?: boolean;
    useCare?: boolean;
    useTunnelForFIS?: boolean;
    totalDifficulty?: number;
}

export type FilteredDifficultyCache = Partial<
    Omit<
        DifficultyCache,
        "stopAfterFirstNack" | "sensitiveTTL" | "timeValidations" | "totalDifficulty"
    >
>;

export interface IFlowSettingsPanelProps {
    autoScrollEnabled: boolean;
    onAutoScrollChange: (value: boolean) => void;
    experimentalMode: boolean;
    onExperimentalModeChange: (value: boolean) => void;
    sessionDifficulty: FilteredDifficultyCache;
    onSessionDifficultyChange: (key: string, value: boolean) => void;
    singleColumn?: boolean;
}

export type SettingsDraft = {
    autoScrollEnabled: boolean;
    experimentalMode: boolean;
    sessionDifficulty: FilteredDifficultyCache;
    selectedTags: string[];
};

export interface IFlowSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: SettingsDraft | null;
    onDraftChange: (draft: SettingsDraft) => void;
    onSave: () => Promise<void>;
    flowTags: string[];
    isSaving: boolean;
}

export interface IGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    domain?: string;
}

export interface IReportPageProps {
    sessionId: string;
    report: string;
    setStep: React.Dispatch<React.SetStateAction<number>>;
}
