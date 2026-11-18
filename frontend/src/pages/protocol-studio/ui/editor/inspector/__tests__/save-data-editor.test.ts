import { TextDecoder, TextEncoder } from "util";

// jsdom has no TextEncoder; the lib's base64 helpers need it.
Object.assign(globalThis, { TextEncoder, TextDecoder });

import { MockRunnerV2 } from "@ondc/automation-mock-runner";

import { toRows, toSaveData } from "@pages/protocol-studio/ui/editor/inspector/save-data-editor";

const getSave = `function getSave(payload) { return payload.message.order.id; }`;

describe("saveData editor rows", () => {
    it("round-trips v1's map: paths, APPEND# keys and EVAL# functions", () => {
        const map = {
            transactionId: "$.context.transaction_id",
            "APPEND#tags": "$.message.tag",
            orderId: `EVAL#${MockRunnerV2.encodeBase64(getSave)}`,
            "APPEND#ids": `EVAL#${MockRunnerV2.encodeBase64(getSave)}`,
        };
        const rows = toRows(map);
        expect(rows.map(({ key, append, kind }) => [key, append, kind])).toEqual([
            ["transactionId", false, "path"],
            ["tags", true, "path"],
            ["orderId", false, "eval"],
            ["ids", true, "eval"],
        ]);
        expect(rows[2].value).toBe(getSave);
        expect(toSaveData(rows)).toEqual(map);
    });

    it("leaves draft rows with an empty key out of the map", () => {
        const rows = toRows({ a: "$.a" });
        rows.push({ uid: 999, key: "   ", append: false, kind: "path", value: "$.b" });
        expect(toSaveData(rows)).toEqual({ a: "$.a" });
    });
});
