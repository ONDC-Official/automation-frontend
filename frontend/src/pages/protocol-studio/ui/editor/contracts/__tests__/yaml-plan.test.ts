import { readFileSync } from "fs";
import { join } from "path";
import { CST, Parser } from "yaml";

import { parseContract } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import {
    applyPatches,
    invertPatches,
    lineDelta,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/patch";
import {
    duplicateSeqItemEdits,
    EditBlockedError,
    type ContractEdit,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/plan";
import { sharedImpact } from "@pages/protocol-studio/ui/editor/contracts/yaml/shared";
import { detectStyle } from "@pages/protocol-studio/ui/editor/contracts/yaml/style";
import {
    applyEdit,
    applyEdits,
    previewImpact,
} from "@pages/protocol-studio/ui/editor/contracts/yaml/verify";

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

const TRV11 = fixture("trv11-validations.yaml");
const TRV10 = fixture("trv10-validations.yaml");
const FIS12 = fixture("fis12-validations.yaml");
const ACTIONS = fixture("trv11-actions.yaml");

/** Runs an edit and returns the new text, asserting the invariants every edit must keep. */
const edit = (text: string, e: ContractEdit, maxChangedLines = 12) => {
    const before = parseContract(text);
    const { text: after, parsed } = applyEdit(before, e);
    expect(parsed.errors).toEqual([]);
    const delta = lineDelta(text, after);
    expect(delta.added + delta.removed).toBeLessThanOrEqual(maxChangedLines);
    // Comments outside the edited lines survive.
    expect(parsed.census.commentLines).toBeGreaterThanOrEqual(before.census.commentLines - 3);
    return { after, parsed };
};

describe("contract yaml: parse", () => {
    it.each([
        ["trv11", TRV11],
        ["trv10", TRV10],
        ["fis12", FIS12],
        ["actions", ACTIONS],
    ])("%s round-trips byte for byte through the CST", (_name, text) => {
        const tokens = [...new Parser().parse(text)];
        expect(tokens.map((t) => CST.stringify(t)).join("")).toBe(text);
        expect(parseContract(text).errors).toEqual([]);
    });

    it("takes a census of anchors, aliases and comments", () => {
        const { census } = parseContract(FIS12);
        expect(census.anchors).toBeGreaterThan(5);
        expect(census.aliases).toBe(6);
        expect(census.commentLines).toBe(2);
        expect(parseContract(TRV11).census.commentLines).toBe(14);
    });

    it("samples each file's style", () => {
        expect(detectStyle(parseContract(TRV11)).pathQuote).toBe("QUOTE_DOUBLE");
        expect(detectStyle(parseContract(TRV10)).pathQuote).toBe("PLAIN");
        expect(detectStyle(parseContract(TRV11)).indentSeq).toBe(true);
    });
});

describe("contract yaml: scalar edits", () => {
    it("rewrites one value in place, keeping its quotes", () => {
        const { after } = edit(TRV11, {
            op: "setScalar",
            at: ["_TESTS_", "search", 0, "attr"],
            value: "$.context.location.country.name",
        });
        expect(after).toContain('attr: "$.context.location.country.name"');
        expect(lineDelta(TRV11, after)).toEqual({ added: 1, removed: 1 });
    });

    it("quotes strings that would read back as something else", () => {
        const { parsed } = edit(TRV11, {
            op: "setScalar",
            at: ["_TESTS_", "search", 0, "enumList", 0],
            value: "true",
        });
        expect(parsed.doc.getIn(["_TESTS_", "search", 0, "enumList", 0])).toBe("true");
        const guard = edit(TRV10, {
            op: "setScalar",
            at: ["_TESTS_", "search", 1, "_RETURN_", 0, "_RETURN_"],
            value: "!(attr are present) || attr all in enumList",
        });
        expect(guard.parsed.doc.getIn(["_TESTS_", "search", 1, "_RETURN_", 0, "_RETURN_"])).toBe(
            "!(attr are present) || attr all in enumList"
        );
    });

    it("keeps the trailing spaces and comments of other lines", () => {
        const { after } = edit(FIS12, {
            op: "setScalar",
            at: ["_TESTS_", "on_search", 1, "_RETURN_", 2, "_NAME_"],
            value: "VALID_CATEGORY_CODE",
        });
        expect(after).toContain("_RETURN_: attr all in enumList  \n");
        expect(after).toContain("        \n");
    });

    it("adds a missing key through setScalar", () => {
        const { parsed } = edit(TRV11, {
            op: "setScalar",
            at: ["_TESTS_", "select", 1, "_DESCRIPTION_"],
            value: "Provider id is mandatory",
        });
        expect(parsed.doc.getIn(["_TESTS_", "select", 1, "_DESCRIPTION_"])).toBe(
            "Provider id is mandatory"
        );
    });
});

describe("contract yaml: list edits", () => {
    it("adds and removes chips with one line each", () => {
        const { after, parsed } = edit(TRV11, {
            op: "setSeqItems",
            at: ["_TESTS_", "search", 4, "validValues"],
            items: ["AC", "ELECTRIC"],
        });
        expect(parsed.doc.toJS()._TESTS_.search[4].validValues).toEqual(["AC", "ELECTRIC"]);
        expect(lineDelta(TRV11, after)).toEqual({ added: 1, removed: 1 });
    });

    it("rewrites a flow list as a flow list", () => {
        const { after } = edit(TRV11, {
            op: "setSeqItems",
            at: ["_TESTS_", "issue", 1, "_RETURN_", 0, "enumList"],
            items: ["OPEN", "CLOSED"],
        });
        expect(after).toContain("enumList: [ OPEN, CLOSED ]");
    });

    it("turns an empty [] into a block list", () => {
        const { after, parsed } = edit(ACTIONS, {
            op: "insertSeqItem",
            at: ["supportedActions", "on_confirm"],
            index: 0,
            value: "status",
        });
        expect(parsed.doc.toJS().supportedActions.on_confirm).toEqual(["status"]);
        expect(after).toContain("  on_confirm:\n    - status\n");
    });

    it("writes [] when the last value goes", () => {
        const { parsed } = edit(ACTIONS, {
            op: "removeSeqItem",
            at: ["supportedActions", "select"],
            index: 0,
        });
        expect(parsed.doc.toJS().supportedActions.select).toEqual([]);
    });

    it("inserts a whole test in the file's style", () => {
        const { after, parsed } = edit(
            TRV11,
            {
                op: "insertSeqItem",
                at: ["_TESTS_", "select"],
                index: 2,
                value: {
                    _NAME_: "REQUIRED_ITEM_ID",
                    attr: "$.message.order.items[*].id",
                    _RETURN_: "attr are present",
                },
            },
            6
        );
        expect(parsed.doc.toJS()._TESTS_.select).toHaveLength(3);
        expect(after).toContain(
            '    - _NAME_: REQUIRED_ITEM_ID\n      attr: "$.message.order.items[*].id"\n'
        );
    });

    it("removes a test and keeps the comments around it", () => {
        const { after, parsed } = edit(
            TRV11,
            { op: "removeSeqItem", at: ["_TESTS_", "search"], index: 5 },
            10
        );
        expect(parsed.doc.toJS()._TESTS_.search).toHaveLength(5);
        expect(after).toContain("#    - _NAME_: DISABLED_INLINE_TEST");
    });

    it("moves a test up and down", () => {
        // A move rewrites the span between its two ends.
        const down = edit(
            TRV11,
            { op: "moveSeqItem", at: ["_TESTS_", "search"], from: 0, to: 2 },
            40
        );
        expect(
            down.parsed.doc
                .toJS()
                ._TESTS_.search.map((t: { _NAME_: string }) => t._NAME_)
                .slice(0, 3)
        ).toEqual([
            "VALIDATE_CITY_CODE_FORMAT",
            "REQUIRED_CONTEXT_ACTION_9",
            "REQUIRED_CONTEXT_CODE_1",
        ]);
        const up = edit(
            TRV11,
            { op: "moveSeqItem", at: ["_TESTS_", "select"], from: 1, to: 0 },
            40
        );
        expect(up.parsed.doc.toJS()._TESTS_.select[0]._NAME_).toBe("REQUIRED_MESSAGE_ID_1");
    });

    it("duplicates a test, then renames the copy (one step)", () => {
        const { text, parsed } = applyEdits(parseContract(TRV11), [
            { op: "duplicateSeqItem", at: ["_TESTS_", "select"], index: 0 },
            {
                op: "setScalar",
                at: ["_TESTS_", "select", 1, "_NAME_"],
                value: "REQUIRED_CONTEXT_ACTION_COPY",
            },
        ]);
        expect(parsed.errors).toEqual([]);
        const select = parsed.doc.toJS()._TESTS_.select;
        expect(select.map((t: { _NAME_: string }) => t._NAME_)).toEqual([
            "REQUIRED_CONTEXT_ACTION_9",
            "REQUIRED_CONTEXT_ACTION_COPY",
            "REQUIRED_MESSAGE_ID_1",
        ]);
        expect(text.length).toBeGreaterThan(TRV11.length);
    });

    it("duplicates an anchored test without redefining its anchor", () => {
        const { parsed, after } = edit(
            TRV10,
            {
                op: "duplicateSeqItem",
                at: ["_TESTS_", "search", 0, "_RETURN_", 0, "_RETURN_"],
                index: 0,
            },
            6
        );
        expect(parsed.census.redefinedAnchors).toEqual([]);
        expect(after).toContain("            - attr: $.context.timestamp");
    });
});

describe("contract yaml: maps", () => {
    it("adds a key at the end of a test", () => {
        const { parsed } = edit(TRV11, {
            op: "setPair",
            at: ["_TESTS_", "select", 1],
            key: "_CONTINUE_",
            value: "!(attr are present)",
        });
        expect(parsed.doc.getIn(["_TESTS_", "select", 1, "_CONTINUE_"])).toBe(
            "!(attr are present)"
        );
    });

    it("removes the first key of a test, joining the next onto the dash", () => {
        const { after, parsed } = edit(TRV11, {
            op: "removePair",
            at: ["_TESTS_", "select", 1],
            key: "_NAME_",
        });
        expect(parsed.doc.toJS()._TESTS_.select[1]).toEqual({
            attr: "$.message.order.provider.id",
            _RETURN_: "attr are present",
        });
        expect(after).toContain('    - attr: "$.message.order.provider.id"\n');
    });

    it("renames a variable key", () => {
        const { parsed } = edit(TRV11, {
            op: "renameKey",
            at: ["_TESTS_", "search", 1],
            from: "match1",
            to: "cityCodePattern",
        });
        expect(Object.keys(parsed.doc.toJS()._TESTS_.search[1])).toContain("cityCodePattern");
    });

    it("adds a new api with its first test", () => {
        const { parsed } = edit(
            TRV11,
            {
                op: "setPair",
                at: ["_TESTS_"],
                key: "init",
                value: [{ _NAME_: "REQUIRED_X", attr: "$.x", _RETURN_: "attr are present" }],
            },
            6
        );
        expect(parsed.doc.toJS()._TESTS_.init).toHaveLength(1);
    });

    it("never writes merge keys", () => {
        expect(() =>
            applyEdit(parseContract(TRV11), {
                op: "setPair",
                at: ["_TESTS_", "select", 0],
                key: "<<",
                value: {},
            })
        ).toThrow(EditBlockedError);
    });
});

describe("contract yaml: shared nodes", () => {
    it("reports edits that land in an aliased node", () => {
        const parsed = parseContract(FIS12);
        const impact = sharedImpact(parsed, [
            "_TESTS_",
            "select",
            0,
            "_RETURN_",
            0,
            "_RETURN_",
            0,
            "attr",
        ]);
        expect(impact).toMatchObject({
            anchor: "COMMON_CONTEXT",
            throughAlias: true,
            viaAncestor: true,
        });
        expect(impact?.uses).toHaveLength(3);
        expect(sharedImpact(parsed, ["_TESTS_", "on_status", 2, "attr"])).toBeNull();
    });

    it("sees an anchored group of aliases (TRV10)", () => {
        const parsed = parseContract(TRV10);
        expect(sharedImpact(parsed, ["_TESTS_", "init", 0, "_RETURN_", 0, "_NAME_"])?.anchor).toBe(
            "a11"
        );
    });

    it("edits a shared value everywhere it is used", () => {
        const { parsed } = edit(FIS12, {
            op: "setScalar",
            at: ["_TESTS_", "select", 0, "_RETURN_", 0, "_RETURN_", 0, "attr"],
            value: "$.context.domain.code",
        });
        const js = parsed.doc.toJS();
        expect(js._TESTS_.on_search[0]._RETURN_[0]._RETURN_[0].attr).toBe("$.context.domain.code");
        expect(js._TESTS_.on_status[0]._RETURN_[0]._RETURN_[0].attr).toBe("$.context.domain.code");
    });

    it("makes a separate copy, leaving the other uses alone", () => {
        const { parsed } = applyEdits(parseContract(FIS12), [
            { op: "unshare", at: ["_TESTS_", "select", 0, "_RETURN_"] },
            {
                op: "setScalar",
                at: ["_TESTS_", "select", 0, "_RETURN_", 0, "_RETURN_", 0, "attr"],
                value: "$.context.domain.code",
            },
        ]);
        const js = parsed.doc.toJS();
        expect(js._TESTS_.select[0]._RETURN_[0]._RETURN_[0].attr).toBe("$.context.domain.code");
        expect(js._TESTS_.on_status[0]._RETURN_[0]._RETURN_[0].attr).toBe("$.context.domain");
        expect(parsed.census.redefinedAnchors).toEqual([]);
    });

    it("copies an aliased list item out (TRV10 *a1)", () => {
        const { parsed } = edit(
            TRV10,
            { op: "unshare", at: ["_TESTS_", "select", 0, "_RETURN_", 0, "_RETURN_", 0] },
            6
        );
        expect(parsed.census.aliases).toBe(parseContract(TRV10).census.aliases - 1);
    });

    it("copies an aliased enum list out (FIS12 *orderStatus)", () => {
        const { after } = edit(
            FIS12,
            { op: "unshare", at: ["_TESTS_", "on_status", 2, "enumList"] },
            6
        );
        expect(after).toContain("      enumList:\n        - CREATED\n");
    });

    it("duplicates a reused test as a separate copy, leaving the original's name (FIS12)", () => {
        const before = parseContract(FIS12);
        const edits = duplicateSeqItemEdits(before, ["_TESTS_", "on_status"], 1, {
            key: "_NAME_",
            value: "REQUIRED_PROVIDER_ID_COPY",
        });
        expect(edits.map((e) => e.op)).toEqual(["duplicateSeqItem", "unshare", "setScalar"]);
        expect(previewImpact(before, edits)).toBeNull();
        const { parsed } = applyEdits(before, edits);
        const js = parsed.doc.toJS({ maxAliasCount: -1 });
        expect(js._TESTS_.select[1]._NAME_).toBe("REQUIRED_PROVIDER_ID");
        expect(js._TESTS_.on_status[1]._NAME_).toBe("REQUIRED_PROVIDER_ID");
        expect(js._TESTS_.on_status[2]._NAME_).toBe("REQUIRED_PROVIDER_ID_COPY");
        expect(parsed.census.aliases).toBe(before.census.aliases);
        expect(parsed.census.redefinedAnchors).toEqual([]);
    });

    it("copies a list reached through an alias out before duplicating in it (FIS12)", () => {
        const before = parseContract(FIS12);
        const at = ["_TESTS_", "select", 0, "_RETURN_", 0, "_RETURN_"];
        const edits = duplicateSeqItemEdits(before, at, 0, {
            key: "_NAME_",
            value: "REQUIRED_CONTEXT_DOMAIN_COPY",
        });
        expect(edits[0]).toEqual({ op: "unshare", at: ["_TESTS_", "select", 0, "_RETURN_"] });
        expect(previewImpact(before, edits)).toBeNull();
        const { parsed } = applyEdits(before, edits);
        const js = parsed.doc.toJS({ maxAliasCount: -1 });
        const names = (list: { _NAME_: string }[]) => list.map((t) => t._NAME_);
        expect(names(js._TESTS_.select[0]._RETURN_[0]._RETURN_)).toEqual([
            "REQUIRED_CONTEXT_DOMAIN",
            "REQUIRED_CONTEXT_DOMAIN_COPY",
            "REQUIRED_CONTEXT_BAP_ID",
        ]);
        // The other uses of &COMMON_CONTEXT are untouched.
        for (const api of ["on_search", "on_status"]) {
            expect(names(js._TESTS_[api][0]._RETURN_[0]._RETURN_)).toEqual([
                "REQUIRED_CONTEXT_DOMAIN",
                "REQUIRED_CONTEXT_BAP_ID",
            ]);
        }
    });

    it("duplicates an alias item inside a shared group, and says the group is shared (TRV10)", () => {
        const before = parseContract(TRV10);
        const at = ["_TESTS_", "select", 0, "_RETURN_", 0, "_RETURN_"];
        const edits = duplicateSeqItemEdits(before, at, 0, {
            key: "_NAME_",
            value: "REQUIRED_context_timestamp_COPY",
        });
        // &a11 is reused by init: the copy shows there too, so the editor asks first.
        expect(previewImpact(before, edits)?.anchor).toBe("a11");
        const { parsed } = applyEdits(before, edits);
        const js = parsed.doc.toJS({ maxAliasCount: -1 });
        expect(js._TESTS_.search[0]._RETURN_[0]._RETURN_[0]._NAME_).toBe(
            "REQUIRED_context_timestamp"
        );
        expect(js._TESTS_.select[0]._RETURN_[0]._RETURN_[1]._NAME_).toBe(
            "REQUIRED_context_timestamp_COPY"
        );
        expect(parsed.census.redefinedAnchors).toEqual([]);
    });

    it("refuses to remove a value other places reuse", () => {
        expect(() =>
            applyEdit(parseContract(FIS12), {
                op: "removeSeqItem",
                at: ["enums", "loanCategories"],
                index: 0,
            })
        ).toThrow(/reuse/);
        expect(() =>
            applyEdit(parseContract(TRV10), {
                op: "removeSeqItem",
                at: ["_TESTS_", "search", 0, "_RETURN_", 0, "_RETURN_"],
                index: 0,
            })
        ).toThrow(EditBlockedError);
    });
});

describe("contract yaml: trailing comments", () => {
    // A block node's own range runs over trailing comment lines into the next sibling (FIS12 on_status).
    const TEXT = [
        "_TESTS_:",
        "  on_status:",
        "    - _NAME_: GROUP",
        "      _RETURN_:",
        "        - _NAME_: FIRST",
        "          _RETURN_:",
        "            - _NAME_: A",
        "              attr: $.a",
        "            #   _RETURN_: attr are present      ",
        "",
        "        - _NAME_: SECOND",
        "          attr: $.b",
        "  rating:",
        "    - _NAME_: ONLY",
        "      attr: $.c",
        "    #  disabled",
        "  on_rating:",
        "    - _NAME_: R",
        "      attr: $.d",
        "",
    ].join("\n");

    it("removes an item that ends in comments without eating the next one", () => {
        const { parsed, after } = edit(TEXT, {
            op: "removeSeqItem",
            at: ["_TESTS_", "on_status", 0, "_RETURN_"],
            index: 0,
        });
        expect(parsed.doc.toJS()._TESTS_.on_status[0]._RETURN_).toEqual([
            { _NAME_: "SECOND", attr: "$.b" },
        ]);
        expect(after).toContain("#   _RETURN_: attr are present");
    });

    it("empties a list whose last item ends in comments", () => {
        const { parsed } = edit(TEXT, { op: "removeSeqItem", at: ["_TESTS_", "rating"], index: 0 });
        expect(parsed.doc.toJS()._TESTS_).toMatchObject({
            rating: [],
            on_rating: [{ _NAME_: "R" }],
        });
    });
});

describe("contract yaml: patches", () => {
    it("inverts patches", () => {
        const parsed = parseContract(TRV11);
        const { planned, text } = applyEdit(parsed, {
            op: "removeSeqItem",
            at: ["_TESTS_", "search"],
            index: 2,
        });
        expect(applyPatches(text, invertPatches(TRV11, planned.patches))).toBe(TRV11);
    });

    it("refuses structured edits while the file doesn't parse", () => {
        const broken = parseContract(`${TRV11}\n  bad: [\n`);
        expect(() =>
            applyEdit(broken, {
                op: "setScalar",
                at: ["_TESTS_", "search", 0, "_NAME_"],
                value: "X",
            })
        ).toThrow(/YAML errors/);
    });
});
