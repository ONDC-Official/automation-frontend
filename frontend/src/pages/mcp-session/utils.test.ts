import type { McpRun } from "@store/api";
import { expiresIn, isRunActive, orderRuns, runPercent } from "@pages/mcp-session/utils";

const run = (over: Partial<McpRun> = {}): McpRun => ({
    flow_id: "flow",
    transaction_id: null,
    attempt: 1,
    started_at: "2026-08-18T07:00:00.000Z",
    auto_advance: false,
    ...over,
});

describe("runPercent", () => {
    it("is zero for a flow with no steps rather than NaN", () => {
        // `0/0` is the shape of a run whose config could not be read, and a
        // progress bar showing NaN% is worse than one showing nothing.
        expect(runPercent(run({ steps_total: 0, steps_complete: 0 }))).toBe(0);
    });

    it("rounds to whole percent", () => {
        expect(runPercent(run({ steps_total: 3, steps_complete: 1 }))).toBe(33);
    });

    it("treats missing counts as no progress", () => {
        expect(runPercent(run())).toBe(0);
    });
});

describe("isRunActive", () => {
    it("is true only while a run is moving", () => {
        expect(isRunActive(run({ flow_status: "IN_PROGRESS" }))).toBe(true);
        expect(isRunActive(run({ flow_status: "NOT_STARTED" }))).toBe(false);
        expect(isRunActive(run({ flow_status: "COMPLETE" }))).toBe(false);
        expect(isRunActive(run({ flow_status: "BLOCKED" }))).toBe(false);
    });
});

describe("orderRuns", () => {
    it("puts what is moving first and what is finished last", () => {
        const ordered = orderRuns([
            run({ flow_id: "done", flow_status: "COMPLETE" }),
            run({ flow_id: "idle", flow_status: "NOT_STARTED" }),
            run({ flow_id: "live", flow_status: "IN_PROGRESS" }),
        ]);

        expect(ordered.map((r) => r.flow_id)).toEqual(["live", "idle", "done"]);
    });

    it("sinks a run that could not be read to the bottom", () => {
        const ordered = orderRuns([
            run({ flow_id: "broken", error: "no such flow" }),
            run({ flow_id: "done", flow_status: "COMPLETE" }),
        ]);

        expect(ordered.map((r) => r.flow_id)).toEqual(["done", "broken"]);
    });

    it("does not mutate the array it was given", () => {
        // It renders straight off RTK Query's cached value, which is frozen in
        // development — sorting in place would throw.
        const runs = [
            run({ flow_id: "b", flow_status: "COMPLETE" }),
            run({ flow_id: "a", flow_status: "COMPLETE" }),
        ];
        Object.freeze(runs);

        expect(() => orderRuns(runs)).not.toThrow();
        expect(runs[0].flow_id).toBe("b");
    });
});

describe("expiresIn", () => {
    const now = Date.parse("2026-08-18T07:00:00.000Z");

    it("counts down in the largest useful unit", () => {
        expect(expiresIn("2026-08-18T07:40:00.000Z", now)).toBe("40m left");
        expect(expiresIn("2026-08-18T13:00:00.000Z", now)).toBe("6h left");
        expect(expiresIn("2026-08-25T07:00:00.000Z", now)).toBe("7d left");
    });

    it("says so once the session has gone", () => {
        // Expiry is silent on the engine — the store drops a session on TTL and
        // emits nothing — so the page saying it is the only warning there is.
        expect(expiresIn("2026-08-18T06:59:00.000Z", now)).toBe("expired");
    });

    it("does not pretend to know when the timestamp is unreadable", () => {
        expect(expiresIn("not a date", now)).toBe("unknown");
    });
});
