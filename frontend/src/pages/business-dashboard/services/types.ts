// API contracts. Each type notes the backend file it mirrors — when the
// contract changes, edit here first and let `tsc -b` find every call site.
//
// The browser talks to the BFF (`bff/`), which proxies `automation-db`. Paths
// below are relative to that BFF.

/* -------------------------------------------------------------------------
   Sessions — automation-db/src/entity/SessionDetails.ts
------------------------------------------------------------------------- */

/** mirrors: automation-db/src/entity/ActionEnums.ts — SessionType */
export type SessionType = "AUTOMATION" | "MANUAL";

/** mirrors: automation-db/src/entity/ActionEnums.ts — Type */
export type NpType = "BAP" | "BPP";

/** Per-flow verdict recorded in `SessionDetails.flowMap`. */
export type FlowResult = "PASS" | "FAIL";

/**
 * Aggregate verdict for a whole session. Derived server-side from the judged
 * flow counts and returned on every row, so the badge and the `?result=` filter
 * are the same expression and can never disagree:
 *   null    flowsPassed + flowsFailed === 0   (nothing judged yet)
 *   PASS    flowsFailed === 0
 *   FAIL    flowsPassed === 0
 *   MIXED   otherwise
 */
export type SessionResult = "PASS" | "FAIL" | "MIXED";

/** Tags `flowSummary` is keyed by. Kept open — the backend stores a free Map. */
export type FlowSummaryTag = "MANDATORY" | "OPTIONAL" | "REPORTABLE";

/** mirrors: automation-db/src/entity/SessionDetails.ts — IFlow */
export interface Flow {
    id: string;
    status: "PENDING" | "COMPLETED";
    payloads?: string[];
}

/** mirrors: automation-db/src/entity/SessionDetails.ts — IFlowSummaryEntry */
export interface FlowSummaryEntry {
    total: number;
    completed: number;
}

/** mirrors: automation-db/src/entity/SessionDetails.ts — ISessionDetails */
export interface SessionDetails {
    sessionId: string;
    npType: string;
    sessionType: SessionType;
    version?: string | null;
    npId?: string | null;
    domain?: string | null;
    usecaseId?: string | null;
    userId?: string | null;
    flows?: Flow[];
    reportExists?: boolean;
    /** keyed by MANDATORY | OPTIONAL | REPORTABLE */
    flowSummary?: Record<string, FlowSummaryEntry> | null;
    /** keyed by flowId */
    flowMap?: Record<string, FlowResult> | null;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * A row from `GET /api/sessions/`. Extends the stored document with fields the
 * aggregation pipeline derives (plan B3) — the browser must never recompute
 * these, or the table and the CSV export can disagree.
 *
 * mirrors: automation-db aggregation in SessionDetailsRepository (plan B3)
 */
export interface SessionRow extends SessionDetails {
    flowsTotal: number;
    flowsCompleted: number;
    flowsPassed: number;
    flowsFailed: number;
    /**
     * flowsPassed / (flowsPassed + flowsFailed) — over *judged* flows only, so
     * pending flows do not drag it down. A 0..1 fraction, or `null` when nothing
     * has been judged. `null` is not 0 and must not render as "0%".
     */
    passRate: number | null;
    /** see SessionResult — `null` when nothing has been judged */
    result: SessionResult | null;
}

/** Every filter param, shared verbatim by list, stats and export. */
export interface SessionFilters {
    /** ISO date, inclusive lower bound on `createdAt` */
    from?: string;
    /** ISO date, inclusive upper bound on `createdAt` */
    to?: string;
    npType?: string;
    npId?: string;
    domain?: string;
    version?: string;
    sessionType?: string;
    usecaseId?: string;
    userId?: string;
    reportExists?: boolean;
    result?: SessionResult;
    /** partial `sessionId` match */
    q?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
}

/** The paginated envelope every filtered list endpoint returns. */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** `GET /api/sessions/?<filters>` */
export type SessionListResponse = PaginatedResponse<SessionRow>;

/**
 * One breakdown bucket. The key is nullable (a session may carry no domain),
 * and the raw counts ride along so the UI never has to back them out of the
 * rate. `passRate` is 0..1 or `null` when nothing in the bucket was judged.
 */
export interface StatsBucket {
    sessions: number;
    flowsPassed: number;
    flowsFailed: number;
    passRate: number | null;
}

/** `GET /api/sessions/stats?<filters>` — plan B4 */
export interface SessionStatsResponse {
    totals: {
        sessions: number;
        withReports: number;
        flowsTotal: number;
        flowsCompleted: number;
        flowsPassed: number;
        flowsFailed: number;
        /** 0..1, or null when nothing has been judged */
        passRate: number | null;
    };
    /**
     * Ascending by date and SPARSE — a day with no sessions is absent entirely.
     * Must be gap-filled before charting or the trend lies about spacing.
     */
    byDay: Array<{
        date: string;
        sessions: number;
        passed: number;
        failed: number;
    }>;
    /** all breakdowns ordered by `sessions` descending */
    byDomain: Array<StatsBucket & { domain: string | null }>;
    byNpType: Array<StatsBucket & { npType: string | null }>;
    byVersion: Array<StatsBucket & { version: string | null }>;
}

/** `GET /api/sessions/facets` — plan B5, populates the filter dropdowns */
export interface SessionFacets {
    domains: string[];
    versions: string[];
    npTypes: string[];
    sessionTypes: string[];
    usecaseIds: string[];
}

/* -------------------------------------------------------------------------
   Network Participants
   mirrors: automation-db/src/repositories/SessionDetailsRepository.ts
------------------------------------------------------------------------- */

/** Filters the participants list accepts. Narrower than SessionFilters — a
 *  participant is a group of sessions, so only session-level dimensions apply. */
export interface NpFilters {
    from?: string;
    to?: string;
    npType?: string;
    domain?: string;
    version?: string;
    sessionType?: string;
    /** Partial host match. */
    q?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
}

/**
 * `GET /api/sessions/participants` — one Network Participant in one role on one
 * domain+version, keyed by the host of its subscriber URL (`npId` /
 * `context.bap_uri` / `context.bpp_uri`).
 *
 * mirrors: SessionDetailsRepository.ts — ParticipantRow
 *
 * The three flow figures are distinct flow *identities*, never per-session
 * totals, so `flowsJudged` can never exceed `flowsAttempted`.
 */
export interface ParticipantRow {
    host: string;
    /**
     * One role, one domain and one version per row: a host that acted as both
     * sides, or spanned domains, appears once per combination. Null is a real
     * value — "ran sessions with none recorded" — never "unknown".
     */
    npType: string | null;
    domain: string | null;
    version: string | null;
    /** The raw subscriber URLs that collapsed into this row. */
    npIds: string[];
    sessions: number;
    firstSessionAt: string | null;
    lastSessionAt: string | null;
    firstPayloadAt: string | null;
    flowsAttempted: number;
    flowsJudged: number;
    flowsPassed: number;
    /**
     * Judged but never passed — the complement of `flowsPassed`, not a count of
     * FAIL verdicts. So `flowsPassed + flowsFailed === flowsJudged` on every row.
     */
    flowsFailed: number;
    /** 0..1 over judged flows. Null — never 0 — when nothing is judged. */
    passRate: number | null;
}

export type ParticipantListResponse = PaginatedResponse<ParticipantRow>;

/** `GET /api/sessions/participants/:host` — mirrors ParticipantDetail */
export interface ParticipantDetail extends ParticipantRow {
    recentSessions: Array<{
        sessionId: string;
        npType: string | null;
        domain: string | null;
        version: string | null;
        createdAt: string | null;
        reportExists: boolean;
        flowsJudged: number;
        flowsPassed: number;
    }>;
    /** Verdict counts per flow — deliberately NOT flattened to distinct. */
    flows: Array<{ flowId: string; passed: number; failed: number }>;
}

/* -------------------------------------------------------------------------
   Reports — automation-db/src/entity/Reports.ts
------------------------------------------------------------------------- */

/** The session context joined onto a report row — saves an N+1 from the browser. */
export interface ReportSession {
    sessionId: string;
    domain?: string | null;
    version?: string | null;
    npType?: string | null;
    npId?: string | null;
    sessionType?: SessionType | null;
    usecaseId?: string | null;
    createdAt?: string;
}

/**
 * mirrors: automation-db/src/entity/Reports.ts — IReport, plus the session join
 * added in plan B7. `file_id` is deliberately never exposed.
 */
export interface Report {
    /** convention: "PW_" + sessionId */
    test_id: string;
    user_id?: string;
    total_tests?: number;
    passed_tests?: number;
    flow_summary?: Record<string, FlowSummaryEntry>;
    createdAt: string;
    updatedAt: string;
    /** `test_id` with the "PW_" prefix stripped; null if it had no such prefix */
    sessionId: string | null;
    /** null for an orphaned report */
    session: ReportSession | null;
}

/** Filters accepted by `GET /report/` — plan B7 */
export interface ReportFilters {
    page?: number;
    limit?: number;
    userId?: string;
    /** partial `test_id` match */
    q?: string;
    sort?: string;
    order?: "asc" | "desc";
}

/** `GET /report/?<filters>` — 200 with an empty envelope when nothing matches */
export type ReportListResponse = PaginatedResponse<Report>;

/**
 * `GET /report/:testId`. `data` is canonically a `data:text/html;base64,…` URI
 * out of GridFS. It is handed to a sandboxed iframe, never injected into the DOM.
 *
 * mirrors: automation-db ReportService.getReportByTestId
 */
export interface ReportBlob {
    test_id: string;
    data: string;
}

/**
 * Validation failure body shared by every new endpoint. Note `messages` is
 * plural and carries EVERY problem at once — surface them together.
 */
export interface ValidationErrorBody {
    error: true;
    messages: string[];
}

/* -------------------------------------------------------------------------
   Payloads — automation-db/src/entity/Payload.ts
------------------------------------------------------------------------- */

/** mirrors: automation-db/src/entity/Payload.ts — PayloadSchema */
export interface PayloadDetail {
    payloadId: string;
    sessionId: string;
    messageId?: string;
    transactionId?: string;
    flowId?: string;
    action?: string;
    bppId?: string;
    bapId?: string;
    reqHeader?: string;
    jsonRequest?: unknown;
    jsonResponse?: unknown;
    httpStatus?: number;
    action_id?: string;
    createdAt?: string;
    updatedAt?: string;
}

/* -------------------------------------------------------------------------
   Auth — bff/ (plan Phase C). The BFF owns the session cookie; the browser
   only ever sends a password and reads an `authenticated` boolean back.
------------------------------------------------------------------------- */

/** `POST /auth/login` request body */
export interface LoginRequest {
    password: string;
}

/** `GET /auth/me` */
export interface MeResponse {
    authenticated: boolean;
}
