import { Request, RequestHandler, Response } from "express";
import { pipeline } from "node:stream/promises";
// Raw axios on purpose: utils/axios installs a request interceptor that sets
// x-api-key from API_SERVICE_KEY for known service URLs, which would overwrite
// the key this proxy deliberately chooses below.
import axios from "axios";
import logger from "@ondc/automation-logger";
import type { DashboardConfig } from "../config/dashboardConfig";
import {
	issueToken,
	passwordMatches,
	verifyToken,
} from "../utils/dashboardSession";

/**
 * Path prefixes the dashboard may reach. Everything else in automation-db —
 * /payload, /user, /protocol-specs — stays unreachable from the browser.
 */
export const ALLOWED_PREFIXES = ["/api/sessions", "/report"] as const;

/**
 * Read-only by construction.
 *
 * automation-db's API key grants full write access to every session, user and
 * report. The dashboard only ever reads, so the proxy refuses anything but GET
 * and HEAD: a bug or a bored user cannot delete production sessions through it.
 * Widening this should be a deliberate, reviewed change.
 */
const ALLOWED_METHODS = new Set(["GET", "HEAD"]);

/**
 * Upstream headers worth passing back. Everything else is dropped, so nothing
 * the upstream sets can reach the browser by accident.
 *
 * content-encoding is forwarded together with `decompress: false` below: if the
 * proxy decompressed the body but passed the original content-length through,
 * the two would disagree and the browser would hang on a truncated response.
 */
const FORWARDED_RESPONSE_HEADERS = [
	"content-type",
	"content-disposition",
	"content-length",
	"content-encoding",
	"cache-control",
] as const;

const cookieOptionsFor = (config: DashboardConfig) => ({
	httpOnly: true,
	secure: config.secureCookies,
	sameSite: "lax" as const,
	maxAge: config.sessionTtlMs,
	path: "/",
});

/**
 * The dashboard's whole auth surface: a single shared password exchanged for an
 * httpOnly cookie. Deliberately modest — automation-db has no user credentials
 * to authenticate against, so anything more elaborate would be theatre.
 * Replacing this with SSO means changing only `login`.
 */
export const login =
	(config: DashboardConfig): RequestHandler =>
	(req: Request, res: Response) => {
		const { password } = (req.body ?? {}) as { password?: unknown };

		if (!passwordMatches(password, config.dashboardPassword)) {
			res.status(401).json({ error: true, message: "Invalid password" });
			return;
		}

		res.cookie(config.cookieName, issueToken(config), cookieOptionsFor(config));
		res.status(204).end();
	};

export const logout =
	(config: DashboardConfig): RequestHandler =>
	(_req: Request, res: Response) => {
		res.clearCookie(config.cookieName, {
			...cookieOptionsFor(config),
			maxAge: undefined,
		});
		res.status(204).end();
	};

export const me =
	(config: DashboardConfig): RequestHandler =>
	(req: Request, res: Response) => {
		const token = req.cookies?.[config.cookieName] as string | undefined;
		res.json({ authenticated: verifyToken(token, config) });
	};

const isAllowedPath = (path: string): boolean =>
	ALLOWED_PREFIXES.some(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`)
	);

/**
 * Streaming, allow-listed, read-only reverse proxy onto automation-db.
 *
 * Holds no business logic on purpose. If you find yourself writing an
 * aggregation here, it belongs in automation-db instead — that is the whole
 * architectural point.
 */
export const proxy =
	(config: DashboardConfig): RequestHandler =>
	async (req: Request, res: Response) => {
		if (!ALLOWED_METHODS.has(req.method)) {
			res.status(405).json({
				error: true,
				message: "This dashboard is read-only",
			});
			return;
		}

		// Mounted under /dashboard, so req.url is already the upstream-relative
		// path — query string included.
		if (!isAllowedPath(req.path)) {
			res.status(404).json({ error: true, message: "Not found" });
			return;
		}

		const target = `${config.dbServiceUrl}${req.url}`;

		let upstream;
		try {
			upstream = await axios.request({
				method: req.method as "GET" | "HEAD",
				url: target,
				headers: {
					// The one thing this proxy exists to hold. It must never
					// travel back toward the browser.
					"x-api-key": config.apiServiceKey,
					accept: req.get("accept") ?? "*/*",
				},
				responseType: "stream",
				// Copy the upstream status verbatim rather than throwing on 4xx.
				validateStatus: () => true,
				decompress: false,
			});
		} catch (e: any) {
			logger.error("Dashboard proxy could not reach automation-db", {
				path: req.path,
				error: e?.message,
			});
			res.status(502).json({
				error: true,
				message: "Upstream service unavailable",
			});
			return;
		}

		res.status(upstream.status);
		for (const header of FORWARDED_RESPONSE_HEADERS) {
			const value = upstream.headers[header];
			if (value !== undefined && value !== null) {
				res.setHeader(header, value as string | string[]);
			}
		}

		try {
			// Streamed, not buffered — a CSV export of the whole session table
			// must not have to fit in this process's memory.
			await pipeline(upstream.data, res);
		} catch {
			res.destroy();
		}
	};
