/**
 * Regression guard for the business-dashboard "Failed" inflation bug.
 *
 * `SessionCache.flowMap` (Redis) is `flowId -> transactionId`. automation-db's
 * `SessionDetails.flowMap` is `flowId -> "PASS" | "FAIL"`, a per-flow verdict map
 * owned by the report service. They are different things under one name, and
 * updateSessionService used to stamp the literal "RUN" over the former and write
 * it into the latter on every session update.
 *
 * automation-db counts `flowsJudged` as *every* flowMap key and derives
 * `flowsFailed = judged - passed`, so each "RUN" entry surfaced as a failed flow
 * on the participants page while the per-flow drill-down — which matches "PASS"
 * and "FAIL" literally — showed nothing but zeros.
 *
 * The type on upsertSessionInDb now makes that write un-expressible, but the
 * original bug was an untyped seam surviving a refactor, so this pins the
 * behaviour too.
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

const upsertSessionInDb = vi.fn().mockResolvedValue({});
vi.mock("../services/dbService", () => ({
	upsertSessionInDb: (...args: unknown[]) => upsertSessionInDb(...args),
}));

const { RedisService } = await import("@ondc/ondc-automation-cache-lib");
const { updateSessionService } = await import("../services/sessionService");

const SESSION_ID = "session-under-test";

/** A session mid-run: two flows started, each mapped to its transaction id. */
const seedSession = () => {
	RedisService.__reset();
	RedisService.__store.set(
		SESSION_ID,
		JSON.stringify({
			transactionIds: ["txn-a", "txn-b"],
			flowMap: { FLOW_A: "txn-a", FLOW_B: "txn-b" },
			npType: "BAP",
			domain: "ONDC:RET10",
			version: "2.0.0",
			subscriberUrl: "https://np.example.com",
			usecaseId: "uc-1",
			env: "STAGING",
			sessionDifficulty: {},
			activeFlow: "FLOW_A",
			activeStep: 1,
		})
	);
};

describe("updateSessionService and the verdict flowMap", () => {
	beforeEach(() => {
		upsertSessionInDb.mockClear();
		seedSession();
	});

	it("never sends flowMap to automation-db", async () => {
		await updateSessionService(SESSION_ID, { activeStep: 3 } as never, {});

		expect(upsertSessionInDb).toHaveBeenCalledTimes(1);
		const [sessionId, payload] = upsertSessionInDb.mock.calls[0];

		expect(sessionId).toBe(SESSION_ID);
		expect(payload).not.toHaveProperty("flowMap");
		// The upsert itself must stay — it is what advances `updatedAt`, which the
		// dashboard sorts and exports on as the session's last-activity signal.
		expect(payload).toEqual({ npType: "BAP" });
	});

	// The Redis cache was never the victim here — the bad rewrite ran after
	// setKey, so only the DB write was poisoned. Pinned anyway: the two maps stay
	// distinct only as long as nothing rewrites this one in place.
	it("never stamps 'RUN' over the cached transaction ids", async () => {
		await updateSessionService(SESSION_ID, { activeStep: 3 } as never, {});

		const cached = JSON.parse(RedisService.__store.get(SESSION_ID) as string);
		expect(cached.flowMap).toEqual({ FLOW_A: "txn-a", FLOW_B: "txn-b" });
		expect(Object.values(cached.flowMap)).not.toContain("RUN");
	});

	it("still persists the fields it does own", async () => {
		await updateSessionService(
			SESSION_ID,
			{ activeStep: 7, activeFlow: "FLOW_B", npType: "BPP" } as never,
			{}
		);

		const cached = JSON.parse(RedisService.__store.get(SESSION_ID) as string);
		expect(cached.activeStep).toBe(7);
		expect(cached.activeFlow).toBe("FLOW_B");
		expect(upsertSessionInDb.mock.calls[0][1]).toEqual({ npType: "BPP" });
	});
});
