import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";

export interface FormValues {
    bppId: string;
    bppUri: string;
    domain: string;
    version: string;
    usecase: string;
    environment: string;
}

export interface SessionData {
    sessionId: string;
    bppId: string;
    bppUri: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

export interface ActiveSessionPanelsProps {
    sessionData: SessionData;
    isDeleting: boolean;
    handleDelete: () => Promise<void>;
    handleNewSession: () => void;
    setDiscoveryComplete: (value: boolean) => void;
    discoveryComplete: boolean;
}

export interface CreateSessionPanelProps {
    handleSubmit: UseFormHandleSubmit<FormValues>;
    onSubmit: (data: FormValues) => Promise<void>;
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    isLoading: boolean;
}

export interface DiscoverySectionProps {
    sessionId: string;
    bppUri: string;
    createdAt: string;
    status: string;
    onUpload: () => void;
    isUploading?: boolean;
    onDiscoveryComplete: () => void;
}

export interface PayloadResponse {
    payload: Record<string, unknown>;
}

export interface DiscoveryResponse {
    [key: string]: unknown;
}

export interface PreorderLoadTestProps {
    sessionId: string;
    status: string;
    discoveryComplete: boolean;
}

export interface PreorderResponse {
    session_id: string;
    run_id: string;
}

export interface StageMetric {
    stage: string;
    sent: number;
    success: number;
    failure: number;
    timeout: number;
    isChild?: boolean;
}

export interface RunMetricsData {
    runId: string;
    status: string;
    progress: number;
    rps: number;
    duration: string;
    started: string;
    completed: string;
    stages: StageMetric[];
}

export interface RunMetricsProps {
    data: RunMetricsData;
}
