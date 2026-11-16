import type { MappedStep } from "@/types/flow-state-type";
import { extractRequestError, findErroredSteps, pairLabel } from "./step-error";

const ack = { message: { ack: { status: "ACK" as const } } };

function apiStep(
    actionId: string,
    actionType: string,
    payloadIds: string[],
    extra: Partial<MappedStep> = {}
): MappedStep {
    return {
        status: "COMPLETE",
        actionId,
        actionType,
        owner: "BAP",
        index: 0,
        unsolicited: false,
        pairActionId: null,
        payloads: {
            entryType: "API",
            action: actionType,
            messageId: "m1",
            timestamp: "2026-10-26T11:47:15.633Z",
            subStatus: "SUCCESS",
            payloads: payloadIds.map((payloadId) => ({ payloadId, response: ack })),
        },
        ...extra,
    } as MappedStep;
}

describe("findErroredSteps", () => {
    it("flags a step whose count is 2 and names its pair", () => {
        const sequence = [
            apiStep("init_METRO", "init", ["p1", "p2"], { pairActionId: "on_init_METRO" }),
            apiStep("on_init_METRO", "on_init", ["p3"]),
        ];
        expect(findErroredSteps(sequence)).toEqual([
            {
                actionId: "init_METRO",
                actionType: "init",
                pairLabel: "on_init",
                lastPayloadId: "p2",
                payloadIds: ["p1", "p2"],
                requestNumber: 2,
            },
        ]);
    });

    it("ignores steps with a single request, incomplete steps and form entries", () => {
        const form = apiStep("form", "dynamic_form", ["x", "y"]);
        form.payloads = { entryType: "FORM", formType: "HTML_FORM", formId: "f", timestamp: "t" };
        const sequence = [
            apiStep("search", "search", ["p1"]),
            apiStep("select", "select", ["p1", "p2"], { status: "WAITING" }),
            form,
        ];
        expect(findErroredSteps(sequence)).toEqual([]);
    });

    it("uses the last of several requests", () => {
        const [step] = findErroredSteps([apiStep("confirm", "confirm", ["a", "b", "c"])]);
        expect(step.lastPayloadId).toBe("c");
        expect(step.requestNumber).toBe(3);
    });
});

describe("pairLabel", () => {
    it("falls back to on_<action> without a pair", () => {
        expect(pairLabel(apiStep("search", "search", []), [])).toBe("on_search");
    });

    it("falls back to the request action for an on_ step", () => {
        expect(pairLabel(apiStep("on_select", "on_select", []), [])).toBe("select");
    });
});

describe("extractRequestError", () => {
    it("reads a numeric code and the message from the request", () => {
        const req = {
            context: { action: "init" },
            error: { code: 400, message: "order.provider.id is required" },
        };
        expect(extractRequestError(req)).toEqual({
            code: "400",
            message: "order.provider.id is required",
        });
    });

    it("reads a string code", () => {
        expect(
            extractRequestError({ error: { code: "VALIDATION_ERROR", message: "Bad" } })
        ).toEqual({ code: "VALIDATION_ERROR", message: "Bad" });
    });

    it("returns null when the request has no error", () => {
        expect(extractRequestError({ context: {}, message: {} })).toBeNull();
        expect(extractRequestError(undefined)).toBeNull();
        expect(extractRequestError({ error: {} })).toBeNull();
    });
});
