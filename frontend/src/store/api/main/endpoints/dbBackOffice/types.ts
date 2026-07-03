export interface IAdminAuthResponse {
    authenticated: boolean;
}

export interface IAdminAuthCredentials {
    username: string;
    password: string;
}

export interface IGetPayloadsParams {
    domain: string;
    version: string;
    action: string;
    page: string;
}

export interface IVersionResult {
    version: string;
    usecases: string[];
    status: number | null;
    healthy: boolean;
    error?: string;
}

export interface IDomainResult {
    domain: string;
    versions: IVersionResult[];
}

export interface IHealthSummary {
    totalChecked: number;
    totalHealthy: number;
    totalUnhealthy: number;
}

export interface IHealthReportData {
    status: string;
    message: string;
    summary: IHealthSummary;
    results: IDomainResult[];
}

export interface PayloadResponse<TReq = unknown, TRes = unknown> {
    req: TReq;
    res: {
        response: TRes;
    };
}

export interface IReportResponse {
    data: string;
}

export interface ISessionsResponse {
    sessions: Array<{
        sessionId: string;
        reportExists: boolean;
        createdAt: string;
        domain?: string;
        version?: string;
        usecaseId?: string;
        userId?: string | null;
        flows?: Array<{ id: string; status: "PENDING" | "COMPLETED"; payloads?: string[] }>;
        flowSummary?: Record<string, { total: number; completed: number }> | null;
        flowMap?: Record<string, "PASS" | "FAIL"> | null;
    }>;
}
