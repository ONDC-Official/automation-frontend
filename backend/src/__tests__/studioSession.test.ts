/**
 * Protocol Studio live sessions: stored as playground sessions (so the flow
 * proxies and the api-service route them to the mock's playground router) and
 * flagged `engine: "graph-v2"`, with the graph document under
 * `PLAYGROUND_V2_<sessionId>` — never under the v1 `PLAYGROUND_<sessionId>` key.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("../services/dbService", () => ({ upsertSessionInDb: vi.fn() }));

const { RedisService } = await import("@ondc/ondc-automation-cache-lib");
const { createStudioSession, getStudioSession } = await import(
	"../controllers/sessionController"
);

const SESSION_ID = "studio-session";

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
	graph: { nodes: [{ id: "search" }], edges: [] },
	journeys: [{ id: "happy", entry: "search" }],
};

const sessionData = {
	subscriberUrl: "https://np.example.com",
	npType: "BPP",
	domain: "ONDC:TRV14",
	version: "2.0.0",
	usecaseId: "anything",
	flowConfigs: {},
};

describe("Studio live sessions", () => {
	beforeEach(() => RedisService.__reset());

	it("stores the session as a graph-v2 playground session and the graph document", async () => {
		const res = response();
		await createStudioSession(
			{ sessionID: SESSION_ID, body: { sessionData, studioConfig } } as any,
			res
		);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send.mock.calls[0][0]).toMatchObject({
			sessionId: SESSION_ID,
			subscriberUrl: sessionData.subscriberUrl,
		});

		const session = JSON.parse(RedisService.__store.get(SESSION_ID));
		expect(session.usecaseId).toBe("PLAYGROUND-FLOW");
		expect(session.engine).toBe("graph-v2");
		expect(JSON.parse(RedisService.__store.get(`PLAYGROUND_V2_${SESSION_ID}`))).toEqual(
			studioConfig
		);
		expect(RedisService.__store.has(`PLAYGROUND_${SESSION_ID}`)).toBe(false);
	});

	it("rejects a request without a usable graph document", async () => {
		for (const body of [
			{ sessionData },
			{ sessionData, studioConfig: { ...studioConfig, kind: "v1" } },
			{ sessionData, studioConfig: { ...studioConfig, journeys: [] } },
			{ sessionData: { ...sessionData, npType: "X" }, studioConfig },
		]) {
			const res = response();
			await createStudioSession({ sessionID: SESSION_ID, body } as any, res);
			expect(res.status).toHaveBeenCalledWith(400);
		}
		expect(RedisService.__store.size).toBe(0);
	});

	it("serves the graph document back, 404 when there is none", async () => {
		RedisService.__store.set(
			`PLAYGROUND_V2_${SESSION_ID}`,
			JSON.stringify(studioConfig)
		);
		const ok = response();
		await getStudioSession({ query: { session_id: SESSION_ID } } as any, ok);
		expect(ok.status).toHaveBeenCalledWith(200);
		expect(ok.send).toHaveBeenCalledWith(studioConfig);

		const missing = response();
		await getStudioSession({ query: { session_id: "nope" } } as any, missing);
		expect(missing.status).toHaveBeenCalledWith(404);
	});
});
