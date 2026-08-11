import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadDashboardConfig } from "../config/dashboardConfig";

/**
 * Ported from bff/src/__tests__/config.test.ts. The BFF threw and refused to
 * boot; here an incomplete config resolves to a failure the router turns into a
 * 503, so one unset variable cannot take the whole workbench backend down. The
 * property under test is the same either way: the dashboard must not serve a
 * byte without a validated secret.
 */

const VALID = {
	DB_SERVICE: "http://localhost:5001",
	DB_SERVICE_API_KEY: "upstream-key",
	DASHBOARD_PASSWORD: "hunter2",
	DASHBOARD_SESSION_SECRET: "s".repeat(32),
};

let original: NodeJS.ProcessEnv;

beforeEach(() => {
	original = { ...process.env };
	for (const key of Object.keys(VALID)) delete process.env[key];
	delete process.env.DASHBOARD_COOKIE_NAME;
	delete process.env.DASHBOARD_SESSION_TTL_MS;
	delete process.env.SECURE_COOKIES;
	Object.assign(process.env, VALID);
});

afterEach(() => {
	process.env = original;
});

const expectOk = (result: ReturnType<typeof loadDashboardConfig>) => {
	if (!result.ok) throw new Error(`expected ok, got: ${result.reason}`);
	return result.config;
};

describe("loadDashboardConfig", () => {
	it("loads a complete configuration", () => {
		expect(expectOk(loadDashboardConfig())).toMatchObject({
			dbServiceUrl: "http://localhost:5001",
			apiServiceKey: "upstream-key",
			dashboardPassword: "hunter2",
			cookieName: "wbd_session",
			sessionTtlMs: 12 * 60 * 60 * 1000,
		});
	});

	it.each(Object.keys(VALID))("fails when %s is missing", (key) => {
		delete process.env[key];

		const result = loadDashboardConfig();
		expect(result.ok).toBe(false);
		expect(result.ok === false && result.reason).toMatch(
			new RegExp(`${key} is required`)
		);
	});

	it.each(Object.keys(VALID))("fails when %s is blank", (key) => {
		process.env[key] = "   ";

		expect(loadDashboardConfig().ok).toBe(false);
	});

	// The signature on the session cookie is all that stands between the
	// internet and a full-access upstream key.
	it("rejects a session secret shorter than 32 characters", () => {
		process.env.DASHBOARD_SESSION_SECRET = "too-short";

		const result = loadDashboardConfig();
		expect(result.ok === false && result.reason).toMatch(
			/at least 32 characters/
		);
	});

	// Reusing the express-session secret would let one auth scheme grant the
	// other; the dashboard reads its own variable and only its own.
	it("does not fall back to SESSION_SECRET", () => {
		delete process.env.DASHBOARD_SESSION_SECRET;
		process.env.SESSION_SECRET = "y".repeat(48);

		expect(loadDashboardConfig().ok).toBe(false);
	});

	it("strips a trailing slash from the upstream URL", () => {
		process.env.DB_SERVICE = "http://localhost:5001/";

		expect(expectOk(loadDashboardConfig()).dbServiceUrl).toBe(
			"http://localhost:5001"
		);
	});

	it("allows the cookie name and TTL to be overridden", () => {
		process.env.DASHBOARD_COOKIE_NAME = "wbd_prod";
		process.env.DASHBOARD_SESSION_TTL_MS = "60000";

		expect(expectOk(loadDashboardConfig())).toMatchObject({
			cookieName: "wbd_prod",
			sessionTtlMs: 60_000,
		});
	});

	it("rejects a non-numeric TTL rather than silently using NaN", () => {
		process.env.DASHBOARD_SESSION_TTL_MS = "twelve hours";

		expect(loadDashboardConfig().ok).toBe(false);
	});

	// Secure cookies must be opt-in, and anything other than "true" is off —
	// no accidental truthiness from a stray value.
	it("only enables secure cookies for the exact string true", () => {
		expect(expectOk(loadDashboardConfig()).secureCookies).toBe(false);

		process.env.SECURE_COOKIES = "yes";
		expect(expectOk(loadDashboardConfig()).secureCookies).toBe(false);

		process.env.SECURE_COOKIES = "true";
		expect(expectOk(loadDashboardConfig()).secureCookies).toBe(true);
	});
});
