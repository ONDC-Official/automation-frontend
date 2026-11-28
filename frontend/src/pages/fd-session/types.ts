/**
 * What the FD workbench returns for an FD session (GET /fd/sessions/:id on our backend, which
 * relays the workbench's /control/sessions/:id). Only the fields the FD pages read.
 */
export type FdRole = "INVESTOR_APP" | "DEPOSIT_ISSUER";
export type Requirement = "required" | "when-seen" | "excluded";

export interface FdPlanItem {
    id: string;
    kind: "action" | "scenario" | "pack";
    requirement: Requirement;
    note: string;
}

export interface FdPlan {
    participant: string;
    role: FdRole;
    declarationVersion: string;
    actionGroups: string[];
    packWebhook: string | null;
    items: FdPlanItem[];
}

export interface FdStep {
    name: string;
    ok: boolean;
    detail: string;
}

export interface FdScenarioOutcome {
    number: number;
    text: string;
    coverage: string;
    outcome: "pass" | "fail" | "skipped";
    reason?: string;
    steps?: FdStep[];
}

export interface FdCheck {
    id: string;
    title: string;
    outcome: "pass" | "fail" | "info" | "not-run";
    summary: string;
    items: { seq?: number; action?: string; message: string }[];
}

export interface FdVerdict {
    participant: string;
    role: FdRole;
    verdict: "PASS" | "FAIL" | "INCOMPLETE" | "NO EVIDENCE" | string;
    checks: FdCheck[];
    counts: { exchanges: number; toParticipant: number; fromParticipant: number };
    coverage: { required: string[]; exercised: string[] };
}

export interface FdRun {
    runId: string;
    sessionId?: string;
    participant: string;
    role: FdRole;
    status: "RUNNING" | "FINISHED" | "STOPPED" | string;
    startedAt: string;
    finishedAt?: string;
    scenarios?: FdScenarioOutcome[];
    pack?: { id: string; name: string; outcome: "pass" | "fail"; steps?: FdStep[] }[];
    sweep?: FdStep[];
    verdict?: FdVerdict;
    exchanges?: number;
}

export interface FdCertificateSummary {
    certificateId: string;
    verdict: "VALID" | "REFUSED" | string;
    issuedAt: string;
    runs: string[];
}

export interface FdGoLive {
    subscriberId: string;
    allowed: boolean;
    status: string;
    certificateId?: string;
    issuedAt?: string;
    reason: string;
}

export interface FdSessionView {
    session: {
        sessionId: string;
        participant: string;
        role: FdRole;
        userId?: string;
        createdAt: string;
    };
    participant: {
        subscriber_id: string;
        role: FdRole;
        subscriber_url: string;
        ukId: string;
        actionGroups: string[];
        hasDeclaration: boolean;
        declarationVersion: string | null;
    } | null;
    plan?: FdPlan;
    planError?: string;
    runs: FdRun[];
    certificates: FdCertificateSummary[];
    goLive: FdGoLive;
    counterpart: { role: string; subscriber_id: string; subscriber_url: string } | null;
}

export interface FdFinding {
    severity: "error" | "warning" | "info";
    code: string;
    message: string;
    fieldPath?: string;
}

export interface FdExchange {
    seq: number;
    at: string;
    direction: "in" | "out";
    method: string;
    url: string;
    action?: string;
    status?: number;
    durationMs: number;
    fault?: string;
    findings: FdFinding[];
    requestBody?: string;
    responseBody?: string;
}

export interface FdCertificateItem {
    id: string;
    requirement: Requirement;
    outcome: "met" | "unmet" | "waived" | "excluded" | "not-seen" | string;
    detail?: string;
}

export interface FdCertificate {
    certificate: {
        certificateId: string;
        subscriberId: string;
        role: FdRole;
        version: string;
        verdict: "VALID" | "REFUSED" | string;
        issuedAt: string;
        reasons: string[];
        findings: string[];
        items: FdCertificateItem[];
        runs: { runId: string; exchanges: number; evidenceSha256: string }[];
        declaration: {
            version: string;
            effectiveFrom: string;
            effectiveTo?: string;
            actionGroups: string[];
        };
        signer: { keyId: string };
    };
    appeals?: unknown[];
}

export interface FdVerification extends FdCertificate {
    signatureValid: boolean;
    status: "VALID" | "REFUSED" | "LAPSED" | string;
    evidenceIntact: boolean;
    evidenceProblems: string[];
    publicKey: string;
    reason?: string;
}
