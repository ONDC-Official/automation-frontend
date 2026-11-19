import { NextFunction, Request, Response } from "express";
import axios from "axios";
import type { PortalConfig } from "../config/portalConfig";
import {
	fetchFlows,
	fetchReportHtml,
	fetchSession,
	fetchSessions,
	fetchSessionScope,
} from "../services/portalDbService";
import { parseFlowsQuery, readQuery, sortFlows, toFlowMeta } from "../utils/portalFlows";
import { sendProblem, toRfc3339 } from "../utils/portalProblem";
import {
	isValidSessionPath,
	parseSessionsQuery,
	toSessionDetail,
	toSessionListItem,
	type StoredSessionDetail,
} from "../utils/portalSessions";

const DB_HEALTH_TIMEOUT_MS = 2000;

/**
 * GET /v1/health. Every data endpoint reads from automation-db, so the API is
 * `degraded` (still 200, as the contract has no other status) when it cannot
 * be reached.
 */
export const getHealth = (config: PortalConfig) => async (_req: Request, res: Response) => {
	let status: "ok" | "degraded" = "ok";
	if (!config.dbServiceUrl) {
		status = "degraded";
	} else {
		try {
			await axios.get(`${config.dbServiceUrl}/health`, { timeout: DB_HEALTH_TIMEOUT_MS });
		} catch {
			status = "degraded";
		}
	}
	res.json({ status, timestamp: toRfc3339(new Date()) });
};

/**
 * GET /v1/flows. With session_id, the session's domain, version and use case
 * are added to the other filters. A session with no organisation belongs to
 * nobody NP Portal can see, so it is treated as not found.
 */
export const listFlows =
	(config: PortalConfig) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { query, errors } = parseFlowsQuery(readQuery(req.originalUrl));
			if (errors.length) {
				sendProblem(res, 400, "One or more filters are invalid", errors);
				return;
			}

			if (query.sessionId) {
				const scope = await fetchSessionScope(config, query.sessionId);
				if (!scope?.orgId) {
					sendProblem(res, 404, "Session not found");
					return;
				}
				const narrow = (filter: string[] | undefined, value?: string | null) =>
					!value || (filter && !filter.includes(value)) ? null : [value];
				const domains = narrow(query.domains, scope.domain);
				const versions = narrow(query.versions, scope.version);
				const usecases = narrow(query.usecases, scope.usecaseId);
				if (!domains || !versions || !usecases) {
					res.json({ data: [] });
					return;
				}
				Object.assign(query, { domains, versions, usecases });
			}

			const flows = (await fetchFlows(config, query)).map(toFlowMeta);
			res.json({ data: sortFlows(flows, query.sort, query.order) });
		} catch (e) {
			next(e);
		}
	};

/**
 * GET /v1/organizations/{org_id}/sessions. Workbench has no list of organisations,
 * so one it has never seen is an empty list, not a 404.
 */
export const listSessions =
	(config: PortalConfig) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			const orgId = req.params.org_id;
			const { query, errors } = parseSessionsQuery(readQuery(req.originalUrl), orgId);
			if (errors.length) {
				sendProblem(res, 400, "One or more filters are invalid", errors);
				return;
			}

			const { sessions, hasMore } = await fetchSessions(config, orgId, query);
			res.json({ data: sessions.map(toSessionListItem), has_more: hasMore });
		} catch (e) {
			next(e);
		}
	};

/**
 * GET /v1/organizations/{org_id}/sessions/{session_id}. The contract has no 400
 * here, so an ID that could never match answers 404 like any other unknown one.
 */
export const getSession =
	(config: PortalConfig) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { org_id: orgId, session_id: sessionId } = req.params;
			const session = isValidSessionPath(orgId, sessionId)
				? await fetchSession(config, orgId, sessionId)
				: null;
			if (!session) {
				sendProblem(res, 404, "Session not found");
				return;
			}
			const flowTags = await fetchSessionFlowTags(config, session);
			res.json(toSessionDetail(session, config.publicBaseUrl, flowTags));
		} catch (e) {
			next(e);
		}
	};

/**
 * The tags of the session's flows, so NP Portal can count mandatory and
 * optional flows without calling /v1/flows. Read from the catalog of the
 * session's domain, version and use case, where a flow ID is unique.
 */
const fetchSessionFlowTags = async (
	config: PortalConfig,
	session: StoredSessionDetail
): Promise<Map<string, string[]>> => {
	const { domain, version, usecaseId } = session;
	if (!session.flowSummary.length || !domain || !version || !usecaseId) {
		return new Map();
	}
	const flows = await fetchFlows(config, {
		domains: [domain],
		versions: [version],
		usecases: [usecaseId],
		tagMatch: "any",
		sort: "flow_id",
		order: "asc",
	});
	return new Map(flows.map((flow) => [flow.flowId, flow.tags ?? []]));
};

/**
 * The report's own scripts (expand/collapse, download) may run, but the page is
 * sandboxed, so if it is ever opened straight in a browser it cannot act as this
 * site. NP Portal is expected to fetch it with the token and show it on its side.
 */
const REPORT_CSP = "sandbox allow-scripts allow-popups allow-modals allow-downloads";

/**
 * GET /v1/organizations/{org_id}/sessions/{session_id}/report: the session's
 * report page as HTML (report_url in the session detail). 404 when the session
 * is not the company's or has no report yet.
 */
export const getSessionReport =
	(config: PortalConfig) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { org_id: orgId, session_id: sessionId } = req.params;
			const scope = isValidSessionPath(orgId, sessionId)
				? await fetchSessionScope(config, sessionId)
				: null;
			if (!scope?.orgId || scope.orgId !== orgId) {
				sendProblem(res, 404, "Session not found");
				return;
			}
			const html = await fetchReportHtml(config, sessionId);
			if (html === null) {
				sendProblem(res, 404, "This session has no report yet");
				return;
			}
			res
				.set({
					"Cache-Control": "no-store",
					"Content-Security-Policy": REPORT_CSP,
					"X-Content-Type-Options": "nosniff",
				})
				.type("text/html; charset=utf-8")
				.send(html);
		} catch (e) {
			next(e);
		}
	};
