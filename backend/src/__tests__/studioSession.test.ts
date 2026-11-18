/**
 * Protocol Studio live sessions: stored as playground sessions (so the flow
 * proxies and the api-service route them to the mock's playground router) and
 * flagged `engine: "graph-v2"`, with the graph document under
 * `PLAYGROUND_V2_<sessionId>` — never under the v1 `PLAYGROUND_<sessionId>` key.
 * Creating one, and reading its document, needs a signed-in user unless
 * STUDIO_SESSIONS_REQUIRE_LOGIN=false.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import request from "supertest";

// utils/axios validates these at import time and throws without them.
for (const key of [
	"API_SERVICE",
	"DB_SERVICE",
	"CONFIG_SERVICE",
	"MOCK_SERVICE",
	"REPORTING_SERVICE",
	"API_SERVICE_KEY",
]) {
	process.env[key] = process.env[key] ?? `http://localhost/${key}`;
}
// Read when the routes load: a small limit keeps the rate-limit test short.
process.env.STUDIO_SESSIONS_PER_MINUTE = "3";

vi.mock("../services/dbService", () => ({ upsertSessionInDb: vi.fn() }));
// The real one starts the OpenTelemetry SDK.
vi.mock("../config/otelConfig", () => ({}));

const { RedisService } = await import("@ondc/ondc-automation-cache-lib");
const { createStudioSession, getStudioSession } = await import(
	"../controllers/sessionController"
);

const SESSION_ID = "studio-session";
const DOC_KEY = `PLAYGROUND_V2_${SESSION_ID}`;
const TOKEN = "Bearer good";

const response = () => {
	const res: any = {};
	res.status = vi.fn(() => res);
	res.send = vi.fn(() => res);
	return res;
};

const studioConfig = {
	kind: "graph-v2-live",
	meta: { domain: "ONDC:TRV14", version: "2.0.0" },
	transaction_data: { transaction_id: "t", latest_timestamp: "x" },
	graph: {
		nodes: [{ id: "search", api: "search", owner: "BAP", kind: "request" }],
		edges: [],
	},
	journeys: [{ id: "happy", entry: "search", choices: {}, expects: {}, onDemand: [] }],
};

const sessionData = {
	subscriberUrl: "https://np.example.com",
	npType: "BPP",
	domain: "ONDC:TRV14",
	version: "2.0.0",
	usecaseId: "anything",
	flowConfigs: {},
};

const post = (body: unknown, authorization?: string) => {
	const res = response();
	const req = {
		sessionID: SESSION_ID,
		body,
		headers: authorization ? { authorization } : {},
	};
	return createStudioSession(req as any, res).then(() => res);
};

const get = (sessionId: string, authorization?: string) => {
	const res = response();
	const req = {
		query: { session_id: sessionId },
		headers: authorization ? { authorization } : {},
	};
	return getStudioSession(req as any, res).then(() => res);
};

/** The login service, answering for `Bearer good` as user 25716 of org 11899. */
const signedIn = () =>
	vi.spyOn(axios, "get").mockImplementation(async (_url, config: any) => {
		if (config?.headers?.Authorization !== TOKEN) throw { response: { status: 401 } };
		return {
			data: { user: { username: "25716", organisations: [{ organisationId: "11899" }] } },
		};
	});

describe("Studio live sessions", () => {
	beforeEach(() => {
		RedisService.__reset();
		delete process.env.STUDIO_SESSIONS_REQUIRE_LOGIN;
		process.env.DEVELOPER_GUIDE_SERVICE = "http://login-service";
		signedIn();
	});
	afterEach(() => vi.restoreAllMocks());

	it("refuses an anonymous request while logins are required (the default)", async () => {
		const res = await post({ sessionData, studioConfig });
		expect(res.status).toHaveBeenCalledWith(401);
		expect(RedisService.__store.size).toBe(0);

		const badToken = await post({ sessionData, studioConfig }, "Bearer bad");
		expect(badToken.status).toHaveBeenCalledWith(401);
	});

	it("takes an anonymous request with the flag off", async () => {
		process.env.STUDIO_SESSIONS_REQUIRE_LOGIN = "false";
		const res = await post({ sessionData, studioConfig });
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send.mock.calls[0][0]).toMatchObject({
			sessionId: SESSION_ID,
			subscriberUrl: sessionData.subscriberUrl,
		});
		const session = JSON.parse(RedisService.__store.get(SESSION_ID));
		expect(session.usecaseId).toBe("PLAYGROUND-FLOW");
		expect(session.engine).toBe("graph-v2");
		expect(JSON.parse(RedisService.__store.get(DOC_KEY))).toEqual(studioConfig);
		expect(RedisService.__store.has(`PLAYGROUND_${SESSION_ID}`)).toBe(false);
	});

	it("stores the confirmed owner on the graph document, not on the session", async () => {
		const res = await post(
			{
				sessionData: { ...sessionData, userId: "forged", orgId: "11899", extra: 1 },
				studioConfig: { ...studioConfig, owner: { userId: "forged" } },
			},
			TOKEN
		);
		expect(res.status).toHaveBeenCalledWith(201);
		const doc = JSON.parse(RedisService.__store.get(DOC_KEY));
		expect(doc.owner).toEqual({ userId: "25716", orgId: "11899" });
		// Only the whitelisted fields reach the session.
		const session = JSON.parse(RedisService.__store.get(SESSION_ID));
		expect(session).not.toHaveProperty("userId");
		expect(session).not.toHaveProperty("orgId");
		expect(session).not.toHaveProperty("extra");
		expect(session).not.toHaveProperty("owner");
		expect(session).toMatchObject({ npType: "BPP", subscriberUrl: sessionData.subscriberUrl });
	});

	it("refuses an organisation the user isn't in", async () => {
		const res = await post(
			{ sessionData: { ...sessionData, orgId: "99999" }, studioConfig },
			TOKEN
		);
		expect(res.status).toHaveBeenCalledWith(403);
		expect(RedisService.__store.size).toBe(0);
	});

	it("rejects a request without a usable graph document", async () => {
		const node = studioConfig.graph.nodes[0];
		for (const body of [
			{ sessionData },
			{ sessionData, studioConfig: { ...studioConfig, kind: "v1" } },
			{ sessionData, studioConfig: { ...studioConfig, journeys: [] } },
			{ sessionData: { ...sessionData, npType: "X" }, studioConfig },
			{
				sessionData,
				studioConfig: {
					...studioConfig,
					graph: { nodes: [{ ...node, api: undefined }], edges: [] },
				},
			},
			{
				sessionData,
				studioConfig: {
					...studioConfig,
					graph: { nodes: [{ ...node, owner: "NP" }], edges: [] },
				},
			},
			{
				sessionData,
				studioConfig: {
					...studioConfig,
					graph: { nodes: [node], edges: [{ id: "e1", from: "search" }] },
				},
			},
			{ sessionData, studioConfig: { ...studioConfig, journeys: [{ id: "happy" }] } },
		]) {
			const res = await post(body, TOKEN);
			expect(res.status).toHaveBeenCalledWith(400);
		}
		expect(RedisService.__store.size).toBe(0);
	});

	it("writes the graph document before the session", async () => {
		const setKey = vi.spyOn(RedisService, "setKey");
		await post({ sessionData, studioConfig }, TOKEN);
		expect(setKey.mock.calls.map(([key]) => key)).toEqual([DOC_KEY, SESSION_ID]);
	});

	it("serves the graph document to any signed-in user, 404 when there is none", async () => {
		RedisService.__store.set(DOC_KEY, JSON.stringify(studioConfig));
		const anonymous = await get(SESSION_ID);
		expect(anonymous.status).toHaveBeenCalledWith(401);

		const ok = await get(SESSION_ID, TOKEN);
		expect(ok.status).toHaveBeenCalledWith(200);
		expect(ok.send).toHaveBeenCalledWith(studioConfig);

		const missing = await get("nope", TOKEN);
		expect(missing.status).toHaveBeenCalledWith(404);

		process.env.STUDIO_SESSIONS_REQUIRE_LOGIN = "false";
		const open = await get(SESSION_ID);
		expect(open.status).toHaveBeenCalledWith(200);
	});
});

describe("POST /sessions/studio through the app", async () => {
	const { default: app } = await import("../app");

	beforeEach(() => {
		RedisService.__reset();
		process.env.DEVELOPER_GUIDE_SERVICE = "http://login-service";
		// The login service doesn't know the token: every request is anonymous.
		vi.spyOn(axios, "get").mockRejectedValue({ response: { status: 401 } });
	});
	afterEach(() => {
		delete process.env.STUDIO_SESSIONS_REQUIRE_LOGIN;
		vi.restoreAllMocks();
	});

	it("refuses a body over 10 MB", async () => {
		process.env.STUDIO_SESSIONS_REQUIRE_LOGIN = "false";
		const big = JSON.stringify({
			sessionData,
			studioConfig: { ...studioConfig, padding: "x".repeat(11 * 1024 * 1024) },
		});
		const res = await request(app)
			.post("/sessions/studio")
			.set("Content-Type", "application/json")
			.send(big);
		expect(res.status).toBe(413);
		expect(RedisService.__store.size).toBe(0);
	});

	it("takes a normal body, and rate-limits only while logins are required", async () => {
		process.env.STUDIO_SESSIONS_REQUIRE_LOGIN = "false";
		for (let i = 0; i < 5; i += 1) {
			const res = await request(app).post("/sessions/studio").send({ sessionData, studioConfig });
			expect(res.status).toBe(201);
		}

		process.env.STUDIO_SESSIONS_REQUIRE_LOGIN = "true";
		const statuses: number[] = [];
		for (let i = 0; i < 4; i += 1) {
			const res = await request(app)
				.post("/sessions/studio")
				.set("Authorization", "Bearer rate-limited")
				.send({ sessionData, studioConfig });
			statuses.push(res.status);
		}
		// Each is anonymous (401) until the limit trips.
		expect(statuses).toEqual([401, 401, 401, 429]);
	});
});
