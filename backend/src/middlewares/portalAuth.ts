import { createHash, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import logger from "@ondc/automation-logger";
import type { PortalConfig } from "../config/portalConfig";
import { sendProblem } from "../utils/portalProblem";
import { verifyReportToken } from "../utils/reportToken";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time comparison, so response time says nothing about the token. */
const sameToken = (sent: string, expected: string) =>
	timingSafeEqual(digest(sent), digest(expected));

/**
 * Lets a request through only with `Authorization: Bearer <PORTAL_API_TOKEN>`.
 * The contract leaves the auth mechanism TBD; this shared token stands in
 * until it is agreed with NP Portal.
 */
export const requirePortalToken =
	(config: PortalConfig) =>
	(req: Request, res: Response, next: NextFunction): void => {
		if (!config.apiToken) {
			logger.error(`Portal API request refused: ${config.tokenProblem}`);
			sendProblem(res, 500, "The Portal API is not configured on this server");
			return;
		}
		const match = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") ?? "");
		if (!match || !sameToken(match[1], config.apiToken)) {
			res.setHeader("WWW-Authenticate", "Bearer");
			sendProblem(res, 401, "Missing or invalid token");
			return;
		}
		next();
	};

/** Field NP Portal sends in the JSON body: its user's token (a JWT). */
export const NP_TOKEN_FIELD = "np_token";

/**
 * The per-user token NP Portal sends in the JSON body, trimmed; "" when absent.
 * Used as the rate-limit key (bucket = portal token + np_token, so each NP
 * Portal user gets their own limit) and as the thing requireNpToken insists on.
 * We do NOT verify it: the portal token proves the caller is NP Portal; np_token
 * is only a per-user bucket label.
 */
export const npTokenFrom = (req: Request): string => {
	const body = req.body as { np_token?: unknown } | undefined;
	return typeof body?.np_token === "string" ? body.np_token.trim() : "";
};

/**
 * Data routes must carry np_token in the body, so rate limiting is always per
 * user (bucket = portal token + np_token); a call without it is rejected.
 * /v1/health is mounted before this, so it stays exempt. Runs after the token
 * check, so only authenticated callers are asked.
 */
export const requireNpToken = (req: Request, res: Response, next: NextFunction): void => {
	if (!npTokenFrom(req)) {
		sendProblem(res, 400, `Missing ${NP_TOKEN_FIELD} in request body`);
		return;
	}
	next();
};

/**
 * The report route can be reached two ways: a browser following report_url's
 * signed `?rt=` (which we verify), or a normal `Authorization: Bearer` call from
 * NP Portal. Either is enough; otherwise 401. This lets report_url open in a
 * browser — which can't send a header — without weakening the rest of /v1.
 */
export const requireReportAccess =
	(config: PortalConfig) =>
	(req: Request, res: Response, next: NextFunction): void => {
		if (!config.apiToken) {
			logger.error(`Portal API report refused: ${config.tokenProblem}`);
			sendProblem(res, 500, "The Portal API is not configured on this server");
			return;
		}
		const rt = typeof req.query.rt === "string" ? req.query.rt : "";
		if (rt && verifyReportToken(rt, req.params.org_id ?? "", req.params.session_id ?? "", config.apiToken)) {
			next();
			return;
		}
		const match = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") ?? "");
		if (match && sameToken(match[1], config.apiToken)) {
			next();
			return;
		}
		res.setHeader("WWW-Authenticate", "Bearer");
		sendProblem(res, 401, "Missing or invalid token");
	};
