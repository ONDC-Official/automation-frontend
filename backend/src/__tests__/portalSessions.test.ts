import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import { portalRoutes } from "../routes/portalRoutes";
import {
	parseSessionsQuery,
	reportUrl,
	toSessionDetail,
	toSessionListItem,
	type StoredSession,
	type StoredSessionDetail,
} from "../utils/portalSessions";
import { verifyReportToken } from "../utils/reportToken";

/** GET /v1/organizations/{org_id}/sessions against a stand-in for automation-db. */

const TOKEN = "portal-test-token-0123456789abcdef";
const DB_KEY = "db-key";

const stored = (overrides: Partial<StoredSession> = {}): StoredSession => ({
	sessionId: "sess_1",
	userId: "25716",
	status: "active",
	reportExists: false,
	sessionType: "AUTOMATION",
	npType: "BAP",
	npId: "https://buyer.example-np.in/ondc",
	domain: "ONDC:RET10",
	version: "1.2.5",
	usecaseId: "GROCERY",
	createdAt: "2026-10-20T09:12:44.123Z",
	lastActivityAt: "2026-10-21T08:03:10.456Z",
	...overrides,
});

describe("GET /v1/organizations/{org_id}/sessions", () => {
	let server: Server;
	let dbUrl: string;
	let received: { path: string; query: any; apiKey?: string }[];
	let reply: { sessions: StoredSession[]; hasMore: boolean };
	let failDb: boolean;

	beforeAll(() => {
		const db = express();
		db.use((req, res) => {
			received.push({ path: req.path, query: req.query, apiKey: req.get("x-api-key") });
			return failDb ? res.status(500).end() : res.json(reply);
		});
		server = db.listen(0);
		const address = server.address();
		dbUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
	});
	afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
	beforeEach(() => {
		received = [];
		reply = { sessions: [stored()], hasMore: false };
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
	const call = (url: string) =>
		unauthed(url).set("Authorization", `Bearer ${TOKEN}`).send({ np_token: "np" });

	it("needs the token", async () => {
		const res = await unauthed("/v1/organizations/org_1/sessions");

		expect(res.status).toBe(401);
		expect(received).toEqual([]);
	});

	it("returns sessions in the contract's format", async () => {
		reply.hasMore = true;

		const res = await call("/v1/organizations/org_1/sessions");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			data: [
				{
					session_id: "sess_1",
					user_id: "25716",
					status: "active",
					report_available: false,
					session_type: "AUTOMATION",
					np_type: "BAP",
					subscriber_url: "https://buyer.example-np.in/ondc",
					domain: "ONDC:RET10",
					version: "1.2.5",
					usecase_id: "GROCERY",
					created_at: "2026-10-20T09:12:44Z",
					last_activity_at: "2026-10-21T08:03:10Z",
				},
			],
			has_more: true,
		});
		expect(received[0].path).toBe("/api/sessions/portal/org_1");
		expect(received[0].apiKey).toBe(DB_KEY);
	});

	it("returns 200 and an empty list for an organisation with no sessions", async () => {
		reply.sessions = [];

		const res = await call("/v1/organizations/unknown/sessions");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ data: [], has_more: false });
	});

	it("passes every filter on to automation-db", async () => {
		await call(
			"/v1/organizations/org_1/sessions?q=buyer&status=active&report_available=true" +
				"&user_id=u1&domain=ONDC:RET10&domain=ONDC:RET11&version=1.2.5&usecase_id=GROCERY" +
				"&np_type=BAP&session_type=AUTOMATION&subscriber_url=https://b.example&flow_id=F1" +
				"&created_from=2026-10-01T00:00:00Z&created_to=2026-11-01T00:00:00Z" +
				"&last_activity_from=2026-10-15T00:00:00Z&last_activity_to=2026-10-22T00:00:00Z"
		);

		expect(received[0].query).toEqual({
			q: "buyer",
			status: "active",
			reportExists: "true",
			userId: "u1",
			domain: ["ONDC:RET10", "ONDC:RET11"],
			version: "1.2.5",
			usecaseId: "GROCERY",
			npType: "BAP",
			sessionType: "AUTOMATION",
			npId: "https://b.example",
			flowId: "F1",
			createdFrom: "2026-10-01T00:00:00Z",
			createdTo: "2026-11-01T00:00:00Z",
			lastActivityFrom: "2026-10-15T00:00:00Z",
			lastActivityTo: "2026-10-22T00:00:00Z",
		});
	});

	it("accepts the most repeats the contract allows", async () => {
		const flows = Array.from({ length: 50 }, (_, i) => `flow_id=F${i}`).join("&");

		const res = await call(`/v1/organizations/org_1/sessions?${flows}`);

		expect(res.status).toBe(200);
	});

	it("refuses bad filters without calling automation-db", async () => {
		const res = await call("/v1/organizations/org_1/sessions?status=open&np_type=buyer");

		expect(res.status).toBe(400);
		expect(res.type).toBe("application/problem+json");
		expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual([
			"/status",
			"/np_type",
		]);
		expect(received).toEqual([]);
	});

	it("refuses an org_id over 64 characters", async () => {
		const res = await call(`/v1/organizations/${"x".repeat(65)}/sessions`);

		expect(res.status).toBe(400);
		expect(res.body.errors[0].field).toBe("/org_id");
	});

	it("keeps an org_id with special characters in one path segment", async () => {
		await call("/v1/organizations/a%2Fb/sessions");

		expect(received[0].path).toBe("/api/sessions/portal/a%2Fb");
	});

	it("answers 500 as a problem when automation-db fails", async () => {
		failDb = true;

		const res = await call("/v1/organizations/org_1/sessions");

		expect(res.status).toBe(500);
		expect(res.type).toBe("application/problem+json");
	});
});

describe("parseSessionsQuery", () => {
	const errorsFor = (raw: Record<string, unknown>, orgId = "org_1") =>
		parseSessionsQuery(raw, orgId).errors.map((e) => e.field);

	it("needs no filters", () => {
		expect(errorsFor({})).toEqual([]);
	});

	it.each([
		["q", { q: "x" }],
		["q", { q: "x".repeat(101) }],
		["status", { status: ["active", "expired"] }],
		["report_available", { report_available: "yes" }],
		["report_available", { report_available: ["true", "false"] }],
		["session_type", { session_type: "automation" }],
		["user_id", { user_id: Array(51).fill("u") }],
		["domain", { domain: Array(51).fill("d") }],
		["version", { version: Array(51).fill("v") }],
		["usecase_id", { usecase_id: Array(51).fill("u") }],
		["subscriber_url", { subscriber_url: Array(51).fill("s") }],
		["flow_id", { flow_id: Array(51).fill("f") }],
		["created_from", { created_from: "yesterday" }],
		["created_to", { created_to: "2026-10-01" }],
		["last_activity_from", { last_activity_from: "2026-13-45T00:00:00Z" }],
		["last_activity_to", { last_activity_to: "2026-10-01T00:00:00" }],
	])("refuses a bad %s", (name, raw) => {
		expect(errorsFor(raw)).toEqual([`/${name}`]);
	});

	it("needs a to time after its from time", () => {
		const at = "2026-10-01T00:00:00Z";

		expect(errorsFor({ created_from: at, created_to: at })).toEqual(["/created_to"]);
		expect(errorsFor({ last_activity_from: at, last_activity_to: at })).toEqual([
			"/last_activity_to",
		]);
	});

	it("accepts a time with an offset", () => {
		expect(errorsFor({ created_from: "2026-10-01T05:30:00+05:30" })).toEqual([]);
	});
});

describe("toSessionListItem", () => {
	it("keeps missing build fields as null", () => {
		const item = toSessionListItem(
			stored({ domain: undefined, version: null, usecaseId: undefined })
		);

		expect(item).toMatchObject({ domain: null, version: null, usecase_id: null });
	});
});

const storedDetail = (overrides: Partial<StoredSessionDetail> = {}): StoredSessionDetail => ({
	...stored(),
	orgId: "org_1",
	expiresAt: "2026-10-25T08:03:10.456Z",
	flowSummary: [
		{ flowId: "ORDER", totalSteps: 4, passedSteps: 2, failedSteps: 1, transactionIds: ["t1", "t2"] },
	],
	settings: {
		protocolValidations: true,
		headerValidaton: false,
		timeValidations: true,
		sensitiveTTL: true,
		useGateway: false,
		stopAfterFirstNack: true,
		useGzip: false,
	},
	settingsHistory: [
		{
			changedAt: "2026-10-21T07:45:02.999Z",
			changedBy: "25716",
			changes: [{ setting: "headerValidaton", previousValue: true, newValue: false }],
		},
	],
	...overrides,
});

describe("GET /v1/organizations/{org_id}/sessions/{session_id}", () => {
	let server: Server;
	let dbUrl: string;
	let received: string[];
	let reply: StoredSessionDetail | null;
	let failDb: boolean;
	// The build's flow catalog, which the API reads each flow's tags from.
	let catalog: { flowId: string; tags?: string[] }[];
	let catalogQueries: Record<string, unknown>[];
	let failCatalog: boolean;

	beforeAll(() => {
		const db = express();
		db.use((req, res) => {
			received.push(req.path);
			if (failDb) return res.status(500).end();
			if (req.path === "/protocol-specs/flows") {
				catalogQueries.push(req.query);
				return failCatalog ? res.status(500).end() : res.json({ flows: catalog });
			}
			return reply ? res.json(reply) : res.status(404).end();
		});
		server = db.listen(0);
		const address = server.address();
		dbUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
	});
	afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
	beforeEach(() => {
		received = [];
		reply = storedDetail();
		failDb = false;
		catalog = [
			{ flowId: "OTHER", tags: ["WORKBENCH", "OPTIONAL"] },
			{ flowId: "ORDER", tags: ["WORKBENCH", "MANDATORY", "REPORTABLE"] },
		];
		catalogQueries = [];
		failCatalog = false;
	});

	const unauthed = (url: string, publicBaseUrl?: string) => {
		const app = express();
		app.use(
			"/v1",
			portalRoutes({
				apiToken: TOKEN,
				rateLimitPerMinute: 1000,
				dbServiceUrl: dbUrl,
				dbApiKey: DB_KEY,
				publicBaseUrl,
			})
		);
		return request(app).get(url);
	};
	const call = (url: string, publicBaseUrl?: string) =>
		unauthed(url, publicBaseUrl).set("Authorization", `Bearer ${TOKEN}`).send({ np_token: "np" });

	it("gives report_url, where NP Portal fetches the report, when the session has a report", async () => {
		reply = storedDetail({ reportExists: true });

		const res = await call("/v1/organizations/org_1/sessions/sess_1", "https://workbench.example/backend-ui");

		expect(res.status).toBe(200);
		expect(res.body.report_available).toBe(true);
		expect(res.body.report_url).toBe(
			"https://workbench.example/backend-ui/v1/organizations/org_1/sessions/sess_1/report"
		);
	});

	it("gives a null report_url when the session has no report", async () => {
		const res = await call("/v1/organizations/org_1/sessions/sess_1", "https://workbench.example/backend-ui");

		expect(res.body.report_available).toBe(false);
		expect(res.body.report_url).toBeNull();
	});

	it("needs the token", async () => {
		expect((await unauthed("/v1/organizations/org_1/sessions/sess_1")).status).toBe(401);
		expect(received).toEqual([]);
	});

	it("returns the session in the contract's format", async () => {
		const res = await call("/v1/organizations/org_1/sessions/sess_1");

		expect(res.status).toBe(200);
		expect(received).toEqual(["/api/sessions/portal/org_1/sess_1", "/protocol-specs/flows"]);
		expect(res.body).toEqual({
			session_id: "sess_1",
			org_id: "org_1",
			user_id: "25716",
			status: "active",
			report_available: false,
			report_url: null,
			session_type: "AUTOMATION",
			np_type: "BAP",
			subscriber_url: "https://buyer.example-np.in/ondc",
			domain: "ONDC:RET10",
			version: "1.2.5",
			usecase_id: "GROCERY",
			created_at: "2026-10-20T09:12:44Z",
			last_activity_at: "2026-10-21T08:03:10Z",
			expires_at: "2026-10-25T08:03:10Z",
			flow_summary: [
				{
					flow_id: "ORDER",
					tags: ["WORKBENCH", "MANDATORY", "REPORTABLE"],
					total_steps: 4,
					passed_steps: 2,
					failed_steps: 1,
					transaction_ids: ["t1", "t2"],
				},
			],
			settings: {
				protocol_validation: true,
				header_validation: false,
				time_validation: true,
				sensitive_ttl: true,
				use_gateway: false,
				stop_after_first_nack: true,
				use_gzip: false,
			},
			settings_history: [
				{
					changed_at: "2026-10-21T07:45:02Z",
					changed_by: "25716",
					changes: [{ setting: "header_validation", previous_value: true, new_value: false }],
				},
			],
		});
	});

	describe("flow tags in flow_summary", () => {
		const flowSummary = (...ids: string[]) =>
			ids.map((flowId) => ({ flowId, totalSteps: 2, passedSteps: 0, failedSteps: 0, transactionIds: [] }));

		it("reads them from the catalog of the session's domain, version and use case", async () => {
			await call("/v1/organizations/org_1/sessions/sess_1");

			expect(catalogQueries).toEqual([
				expect.objectContaining({ domain: "ONDC:RET10", version: "1.2.5", usecase: "GROCERY" }),
			]);
		});

		it("gives every flow its own tags, keeping flow_summary's order", async () => {
			reply = storedDetail({ flowSummary: flowSummary("ORDER", "OTHER") });

			const res = await call("/v1/organizations/org_1/sessions/sess_1");

			expect(res.body.flow_summary.map((f: { flow_id: string; tags: string[] }) => [f.flow_id, f.tags])).toEqual([
				["ORDER", ["WORKBENCH", "MANDATORY", "REPORTABLE"]],
				["OTHER", ["WORKBENCH", "OPTIONAL"]],
			]);
		});

		it("passes tags exactly as the spec has them (case, order, unusual tags)", async () => {
			catalog = [{ flowId: "ORDER", tags: ["Mandatory", "WITH_AA", "REPORTABLE"] }];

			const res = await call("/v1/organizations/org_1/sessions/sess_1");

			expect(res.body.flow_summary[0].tags).toEqual(["Mandatory", "WITH_AA", "REPORTABLE"]);
		});

		it("gives an empty list for a flow missing from the catalog, or one without tags", async () => {
			reply = storedDetail({ flowSummary: flowSummary("ORDER", "GONE") });
			catalog = [{ flowId: "ORDER" }];

			const res = await call("/v1/organizations/org_1/sessions/sess_1");

			expect(res.body.flow_summary.map((f: { tags: string[] }) => f.tags)).toEqual([[], []]);
		});

		it("does not ask the catalog when the session has no flows", async () => {
			reply = storedDetail({ flowSummary: [] });

			const res = await call("/v1/organizations/org_1/sessions/sess_1");

			expect(res.status).toBe(200);
			expect(res.body.flow_summary).toEqual([]);
			expect(catalogQueries).toEqual([]);
		});

		it.each([["domain"], ["version"], ["usecaseId"]] as const)(
			"does not ask the catalog when the session has no %s, and gives empty tags",
			async (field) => {
				reply = storedDetail({ [field]: null });

				const res = await call("/v1/organizations/org_1/sessions/sess_1");

				expect(res.status).toBe(200);
				expect(res.body.flow_summary[0].tags).toEqual([]);
				expect(catalogQueries).toEqual([]);
			}
		);

		it("answers 500 as a problem when the catalog cannot be read, rather than wrong tags", async () => {
			failCatalog = true;

			const res = await call("/v1/organizations/org_1/sessions/sess_1");

			expect(res.status).toBe(500);
			expect(res.type).toBe("application/problem+json");
		});

		it("does not add tags to the session list", async () => {
			const app = express();
			app.use(
				"/v1",
				portalRoutes({ apiToken: TOKEN, rateLimitPerMinute: 1000, dbServiceUrl: dbUrl, dbApiKey: DB_KEY })
			);
			reply = { sessions: [stored()], hasMore: false } as never;

			const res = await request(app)
				.get("/v1/organizations/org_1/sessions")
				.set("Authorization", `Bearer ${TOKEN}`)
				.send({ np_token: "np" });

			expect(res.status).toBe(200);
			expect(res.body.data[0]).not.toHaveProperty("tags");
			expect(res.body.data[0]).not.toHaveProperty("flow_summary");
		});
	});

	it("answers 404 when automation-db has no such session for the company", async () => {
		reply = null;

		const res = await call("/v1/organizations/org_1/sessions/nope");

		expect(res.status).toBe(404);
		expect(res.type).toBe("application/problem+json");
	});

	it("answers 404 for IDs too long to exist, without calling automation-db", async () => {
		expect((await call(`/v1/organizations/${"x".repeat(65)}/sessions/s`)).status).toBe(404);
		expect((await call(`/v1/organizations/o/sessions/${"x".repeat(129)}`)).status).toBe(404);
		expect(received).toEqual([]);
	});

	it("answers 500 as a problem when automation-db fails", async () => {
		failDb = true;

		const res = await call("/v1/organizations/org_1/sessions/sess_1");

		expect(res.status).toBe(500);
		expect(res.type).toBe("application/problem+json");
	});
});

describe("reportUrl", () => {
	const BASE = "https://dev-workbench.ondc.tech/backend-ui";

	it("points at the session's report endpoint in this API", () => {
		expect(reportUrl("11899", "sess_1", true, BASE)).toBe(
			"https://dev-workbench.ondc.tech/backend-ui/v1/organizations/11899/sessions/sess_1/report"
		);
	});

	it("is null without a report or without a public address", () => {
		expect(reportUrl("11899", "sess_1", false, BASE)).toBeNull();
		expect(reportUrl("11899", "sess_1", true, null)).toBeNull();
		expect(reportUrl("11899", "sess_1", true, undefined)).toBeNull();
		expect(reportUrl("11899", "sess_1", true, "")).toBeNull();
	});

	it("keeps odd IDs inside their path segments", () => {
		expect(reportUrl("o/1", "a/b?c#d", true, "https://w.example")).toBe(
			"https://w.example/v1/organizations/o%2F1/sessions/a%2Fb%3Fc%23d/report"
		);
	});
});

describe("toSessionDetail", () => {
	it("gives every flow an empty tag list when no tags are passed in", () => {
		const detail = toSessionDetail(storedDetail());

		expect(detail.flow_summary[0].tags).toEqual([]);
	});

	it("puts tags right after flow_id", () => {
		const detail = toSessionDetail(storedDetail(), null, new Map([["ORDER", ["MANDATORY"]]]));

		expect(Object.keys(detail.flow_summary[0]).slice(0, 2)).toEqual(["flow_id", "tags"]);
	});

	it("signs report_url with a verifiable ?rt= when given a secret and TTL", () => {
		const secret = "report-secret-0123456789abcdef";
		const detail = toSessionDetail(
			storedDetail({ reportExists: true }),
			"https://w.example",
			undefined,
			secret,
			3600
		);

		expect(detail.report_url).toMatch(
			/^https:\/\/w\.example\/v1\/organizations\/org_1\/sessions\/sess_1\/report\?rt=/
		);
		const rt = decodeURIComponent(new URL(detail.report_url as string).searchParams.get("rt") ?? "");
		expect(verifyReportToken(rt, "org_1", "sess_1", secret)).toBe(true);
	});

	it("keeps null for an expired session's expiry and an older session's settings", () => {
		const detail = toSessionDetail(
			storedDetail({ expiresAt: null, settings: null, settingsHistory: [] })
		);

		expect(detail).toMatchObject({ expires_at: null, settings: null, settings_history: [] });
	});

	it("includes optional settings only once they are saved", () => {
		const { settings } = toSessionDetail(
			storedDetail({ settings: { useCare: false, useTunnelForFIS: true } })
		);

		expect(settings).toEqual({ use_care: false, use_tunnel: true });
	});
});

