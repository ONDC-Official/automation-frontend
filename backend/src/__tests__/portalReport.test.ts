import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import { portalRoutes } from "../routes/portalRoutes";

/**
 * GET /v1/organizations/{org_id}/sessions/{session_id}/report against a stand-in
 * for automation-db (session scope + saved report).
 */

const TOKEN = "portal-test-token-0123456789abcdef";
const DB_KEY = "db-key";
const REPORT_HTML = "<!DOCTYPE html><html><body><h1>Report for sess_1</h1><script>1</script></body></html>";
const asStored = (html: string, prefix = true) =>
	(prefix ? "data:text/html;base64," : "") + Buffer.from(html, "utf-8").toString("base64");

describe("GET /v1/organizations/{org_id}/sessions/{session_id}/report", () => {
	let server: Server;
	let dbUrl: string;
	let calls: { path: string; apiKey?: string }[];
	let scopes: Record<string, { orgId?: string | null }>;
	let reports: Record<string, string>;
	let failDb: boolean;

	beforeAll(() => {
		const db = express();
		db.use((req, res, next) => {
			calls.push({ path: req.path, apiKey: req.get("x-api-key") });
			return failDb ? res.status(500).end() : next();
		});
		db.get("/api/sessions/:id/portal-scope", (req, res) => {
			const scope = scopes[req.params.id];
			return scope ? res.json(scope) : res.status(404).end();
		});
		db.get("/report/:testId", (req, res) => {
			const report = reports[req.params.testId];
			return report ? res.json({ test_id: req.params.testId, data: report }) : res.status(404).end();
		});
		server = db.listen(0);
		const address = server.address();
		dbUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
	});
	afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
	beforeEach(() => {
		calls = [];
		scopes = { sess_1: { orgId: "11899" }, no_report: { orgId: "11899" }, logged_out: { orgId: null } };
		reports = { PW_sess_1: asStored(REPORT_HTML), PW_logged_out: asStored(REPORT_HTML) };
		failDb = false;
	});

	const unauthed = (url: string) => {
		const app = express();
		app.use(
			"/v1",
			portalRoutes({ apiToken: TOKEN, rateLimitPerMinute: 1000, dbServiceUrl: dbUrl, dbApiKey: DB_KEY })
		);
		return request(app).get(url);
	};
	const call = (url: string) => unauthed(url).set("Authorization", `Bearer ${TOKEN}`);

	it("returns the report page as HTML for the company's session", async () => {
		const res = await call("/v1/organizations/11899/sessions/sess_1/report");

		expect(res.status).toBe(200);
		expect(res.type).toBe("text/html");
		expect(res.text).toBe(REPORT_HTML);
		expect(calls).toEqual([
			{ path: "/api/sessions/sess_1/portal-scope", apiKey: DB_KEY },
			{ path: "/report/PW_sess_1", apiKey: DB_KEY },
		]);
	});

	it("is never cached, and is sandboxed if opened straight in a browser", async () => {
		const res = await call("/v1/organizations/11899/sessions/sess_1/report");

		expect(res.get("Cache-Control")).toBe("no-store");
		expect(res.get("X-Content-Type-Options")).toBe("nosniff");
		const csp = res.get("Content-Security-Policy") ?? "";
		expect(csp).toMatch(/^sandbox /);
		expect(csp).toContain("allow-scripts");
		expect(csp).not.toContain("allow-same-origin");
	});

	it("echoes the request ID like every other endpoint", async () => {
		const res = await call("/v1/organizations/11899/sessions/sess_1/report").set("X-Request-Id", "r-1");

		expect(res.get("X-Request-Id")).toBe("r-1");
	});

	it("reads a report saved without the data: prefix, and keeps non-English text", async () => {
		reports.PW_sess_1 = asStored("<p>ऑर्डर ✓ — café</p>", false);

		expect((await call("/v1/organizations/11899/sessions/sess_1/report")).text).toBe("<p>ऑर्डर ✓ — café</p>");
	});

	it("needs the token, and asks automation-db nothing without it", async () => {
		const res = await unauthed("/v1/organizations/11899/sessions/sess_1/report");

		expect(res.status).toBe(401);
		expect(res.type).toBe("application/problem+json");
		expect(calls).toEqual([]);
	});

	it("refuses a wrong token", async () => {
		const res = await unauthed("/v1/organizations/11899/sessions/sess_1/report").set(
			"Authorization",
			"Bearer wrong-token-wrong-token-wrong-token"
		);

		expect(res.status).toBe(401);
	});

	it("answers 404 for another company's session, without reading the report", async () => {
		const res = await call("/v1/organizations/99001/sessions/sess_1/report");

		expect(res.status).toBe(404);
		expect(res.type).toBe("application/problem+json");
		expect(res.body.detail).toBe("Session not found");
		expect(calls.map((c) => c.path)).toEqual(["/api/sessions/sess_1/portal-scope"]);
	});

	it("never returns a session made while logged out (no company), even if it has a report", async () => {
		const res = await call("/v1/organizations/11899/sessions/logged_out/report");

		expect(res.status).toBe(404);
		expect(calls.map((c) => c.path)).not.toContain("/report/PW_logged_out");
	});

	it("answers 404 for a session that does not exist", async () => {
		expect((await call("/v1/organizations/11899/sessions/nope/report")).status).toBe(404);
	});

	it("answers 404, saying so, when the company's session has no report yet", async () => {
		const res = await call("/v1/organizations/11899/sessions/no_report/report");

		expect(res.status).toBe(404);
		expect(res.body.detail).toBe("This session has no report yet");
	});

	it("answers 404 for IDs too long to exist, without calling automation-db", async () => {
		expect((await call(`/v1/organizations/${"x".repeat(65)}/sessions/s/report`)).status).toBe(404);
		expect((await call(`/v1/organizations/o/sessions/${"x".repeat(129)}/report`)).status).toBe(404);
		expect(calls).toEqual([]);
	});

	it("answers 500 as a problem when automation-db fails", async () => {
		failDb = true;

		const res = await call("/v1/organizations/11899/sessions/sess_1/report");

		expect(res.status).toBe(500);
		expect(res.type).toBe("application/problem+json");
	});
});
