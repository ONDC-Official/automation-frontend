export interface Session {
    sessionId: string;
    reportExists: boolean;
    createdAt: string;
    domain?: string;
    version?: string;
}
