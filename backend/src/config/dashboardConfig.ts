/**
 * Configuration for the business dashboard's read-only proxy.
 *
 * Ported from the standalone BFF, with one deliberate change. The BFF refused
 * to boot when a value was missing, because holding the upstream credential was
 * its only job. This process has many other jobs, so a missing dashboard
 * password must not take the whole workbench backend down. Instead the config
 * resolves to a failure that the router turns into a 503 on every dashboard
 * route — the dashboard still cannot serve a byte without a validated secret,
 * which is the property that actually mattered.
 */

export interface DashboardConfig {
	dbServiceUrl: string;
	apiServiceKey: string;
	dashboardPassword: string;
	sessionSecret: string;
	cookieName: string;
	sessionTtlMs: number;
	secureCookies: boolean;
}

export type DashboardConfigResult =
	| { ok: true; config: DashboardConfig }
	| { ok: false; reason: string };

const DEFAULT_COOKIE_NAME = "wbd_session";
const DEFAULT_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

class MissingConfig extends Error {}

const required = (name: string): string => {
	const value = process.env[name];
	if (!value || value.trim() === "") {
		throw new MissingConfig(`${name} is required but not set`);
	}
	return value.trim();
};

export function loadDashboardConfig(): DashboardConfigResult {
	try {
		const sessionSecret = required("DASHBOARD_SESSION_SECRET");

		// A short secret makes the session signature guessable, which is the
		// only thing standing between the internet and a full-access API key.
		if (sessionSecret.length < MIN_SECRET_LENGTH) {
			throw new MissingConfig(
				`DASHBOARD_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters`
			);
		}

		const ttl = Number(
			process.env.DASHBOARD_SESSION_TTL_MS ?? DEFAULT_SESSION_TTL_MS
		);
		if (!Number.isFinite(ttl) || ttl <= 0) {
			throw new MissingConfig(
				"DASHBOARD_SESSION_TTL_MS must be a positive number of milliseconds"
			);
		}

		return {
			ok: true,
			config: {
				// Shared with the rest of this backend — see services/dbService.ts.
				dbServiceUrl: required("DB_SERVICE").replace(/\/$/, ""),
				apiServiceKey: required("DB_SERVICE_API_KEY"),
				dashboardPassword: required("DASHBOARD_PASSWORD"),
				sessionSecret,
				cookieName:
					process.env.DASHBOARD_COOKIE_NAME ?? DEFAULT_COOKIE_NAME,
				sessionTtlMs: ttl,
				// Opt-in, and only for the exact string — no accidental
				// truthiness from a stray value.
				secureCookies: process.env.SECURE_COOKIES === "true",
			},
		};
	} catch (e) {
		if (e instanceof MissingConfig) {
			return { ok: false, reason: e.message };
		}
		throw e;
	}
}
