export interface FlowSummaryEntry {
    total: number;
    completed: number;
}

export interface SessionFlow {
    id: string;
    status: "PENDING" | "COMPLETED";
    payloads?: string[];
}

export interface Session {
    sessionId: string;
    reportExists: boolean;
    createdAt: string;
    domain?: string;
    version?: string;
    userId?: string | null;
    flows?: SessionFlow[];
    flowSummary?: Record<string, FlowSummaryEntry> | null;
    flowMap?: Record<string, "PASS" | "FAIL"> | null;
}
