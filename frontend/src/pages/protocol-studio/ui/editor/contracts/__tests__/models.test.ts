import { readFileSync } from "fs";
import { join } from "path";

import {
    buildActionsModel,
    ENTRY_KEY,
    toggleNext,
    togglePartner,
    setAsyncPredecessor,
} from "@pages/protocol-studio/ui/editor/contracts/actions/model";
import {
    describeGuard,
    describeRule,
    parseJval,
    renameJvalVariable,
    sentenceText,
    tryParseJval,
} from "@pages/protocol-studio/ui/editor/contracts/validations/jval";
import {
    buildValidationsModel,
    flattenTests,
    getTestKey,
} from "@pages/protocol-studio/ui/editor/contracts/validations/model";
import {
    canonicalPath,
    mergeScope,
    pathPrefixes,
} from "@pages/protocol-studio/ui/editor/contracts/validations/paths";
import { buildTestIndex } from "@pages/protocol-studio/ui/editor/contracts/validations/test-index";
import {
    buildRefUsers,
    findSchemaNode,
    getSchemaChildren,
    getSchemaRoot,
    getSpecApis,
    listSchemaPaths,
    type SpecJson,
} from "@pages/protocol-studio/ui/editor/contracts/specs/schema";
import { parseContract, toPlain } from "@pages/protocol-studio/ui/editor/contracts/yaml/parse";
import { applyEdits } from "@pages/protocol-studio/ui/editor/contracts/yaml/verify";

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

describe("jval", () => {
    it("parses the compiler's grammar, && binding tighter than ||", () => {
        expect(parseJval("a are present || b all in c && d are unique")).toEqual({
            kind: "or",
            left: { kind: "unary", op: "are present", subject: "a" },
            right: {
                kind: "and",
                left: { kind: "binary", op: "all in", subject: "b", object: "c" },
                right: { kind: "unary", op: "are unique", subject: "d" },
            },
        });
        expect(parseJval("!(useCasePath ALL IN useCode)")).toEqual({
            kind: "not",
            expr: { kind: "binary", op: "all in", subject: "useCasePath", object: "useCode" },
        });
    });

    it("reports where an expression goes wrong", () => {
        expect(tryParseJval("attr are present &&")).toMatchObject({
            error: expect.stringMatching(/Expected/),
            at: 19,
        });
        expect(tryParseJval("attr is present")).toMatchObject({
            error: expect.stringMatching(/operator/),
        });
    });

    it("reads rules and guards as sentences", () => {
        const lookup = (name: string) =>
            ({
                attr: { name, kind: "path" as const, path: "$.context.action" },
                enumList: { name, kind: "list" as const, values: ["search"] },
                useCasePath: {
                    name,
                    kind: "path" as const,
                    path: "$.message.intent.fulfillment.vehicle.category",
                },
                useCode: { name, kind: "list" as const, values: ["METRO"] },
            })[name];
        expect(
            sentenceText(
                describeRule(parseJval("attr are present && attr all in enumList"), lookup)
            )
        ).toBe("$.context.action must be present, every value one of [search]");
        const guard = describeGuard(parseJval("!(useCasePath all in useCode)"), lookup);
        expect(sentenceText(guard.parts)).toBe(
            "only when $.message.intent.fulfillment.vehicle.category is one of [METRO]"
        );
        expect(guard.only).toEqual({
            path: "$.message.intent.fulfillment.vehicle.category",
            values: ["METRO"],
        });
    });

    it("renames a variable without touching operators or spacing", () => {
        expect(
            renameJvalVariable("attr are present &&  attr all in attrList", "attr", "field")
        ).toBe("field are present &&  field all in attrList");
    });
});

describe("paths", () => {
    it("merges a scope the way the compiler does", () => {
        expect(mergeScope("$.code", "$.context.location.city")).toBe(
            "$.context.location.city.code"
        );
        expect(mergeScope("$._EXTERNAL.tx", "$.message")).toBe("$._EXTERNAL.tx");
    });

    it("canonicalises indexes, wildcards and filters", () => {
        expect(
            canonicalPath(
                "$.message.intent.payment.tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code"
            )
        ).toEqual({
            path: "$.message.intent.payment.tags[*].list[*].descriptor.code",
            filters: ["descriptor.code=='BUYER_FINDER_FEES'"],
        });
        expect(canonicalPath("$.message.order.items[0]['id']")?.path).toBe(
            "$.message.order.items[*].id"
        );
        expect(pathPrefixes("$.a.b[*].c")).toEqual(["$.a", "$.a.b", "$.a.b[*]", "$.a.b[*].c"]);
    });
});

describe("validations model", () => {
    const model = buildValidationsModel(parseContract(fixture("trv11-validations.yaml")));

    it("lists apis and tests in file order", () => {
        expect(model.apis).toEqual(["search", "select", "issue"]);
        expect(model.tests.get("search")?.map((t) => t.name)).toEqual([
            "REQUIRED_CONTEXT_CODE_1",
            "VALIDATE_CITY_CODE_FORMAT",
            "REQUIRED_CONTEXT_ACTION_9",
            "REQUIRED_MESSAGE_CATEGORY_12",
            "VALID_VEHICLE_VARIANT",
            "validate_tag_0_BUYER_FINDER_FEES",
        ]);
        expect(model.counts).toEqual({ rules: 10, groups: 2 });
    });

    it("separates checked paths from guard-only paths", () => {
        const category = model.tests.get("search")![3]!;
        expect(category.checks).toEqual(["$.message.intent.fulfillment.vehicle.category"]);
        expect(category.guard?.only).toEqual({
            path: "$.message.intent.fulfillment.vehicle.category",
            values: ["METRO"],
        });
        const city = model.tests.get("search")![1]!;
        expect(city.checks).toEqual(["$.context.location.city.code"]);
        expect(city.guards).toEqual([]);
    });

    it("scopes variables and folds filters", () => {
        const tag = model.tests.get("search")![5]!;
        expect(tag.vars.find((v) => v.name === "subTags")).toMatchObject({
            absolute:
                "$.message.intent.payment.tags[?(@.descriptor.code=='BUYER_FINDER_FEES')].list[*].descriptor.code",
            canonical: "$.message.intent.payment.tags[*].list[*].descriptor.code",
        });
    });

    it("builds groups with inherited variables and scope", () => {
        const group = model.tests.get("issue")![1]!;
        expect(group.kind).toBe("group");
        const child = group.children![0]!;
        expect(child.inherited.map((v) => v.name)).toEqual(["action"]);
        expect(child.effectiveScope).toBe("$.message.issue.actions");
        expect(child.id).toBe("issue/1.0");
        expect(model.byId.get("issue/1.0")).toBe(child);
    });

    it("marks shared tests (FIS12 *COMMON_CONTEXT, TRV10 &a1)", () => {
        const fis = buildValidationsModel(parseContract(fixture("fis12-validations.yaml")));
        expect(fis.tests.get("select")![0]!.shared).toMatchObject({
            anchor: "COMMON_CONTEXT",
            isAlias: true,
            uses: 3,
        });
        expect(fis.tests.get("on_status")![1]!.shared).toMatchObject({
            anchor: "_REQUIRED_PROVIDER_ID",
            isAlias: true,
        });
        expect(fis.definitions.find((d) => d.name === "loanCategories")).toMatchObject({
            group: "enums",
            anchor: "loanCategories",
            uses: 1,
            valueUses: 1,
            values: ["LOAN", "UNSECURED_PERSONAL", "GOLD_LOAN"],
        });
        const trv10 = buildValidationsModel(parseContract(fixture("trv10-validations.yaml")));
        const a1 = trv10.tests.get("search")![0]!.children![0]!.children![0]!;
        expect(a1.shared).toMatchObject({ anchor: "a1", isAlias: false, uses: 2 });
    });

    it("indexes tests by payload path", () => {
        const index = buildTestIndex(model).get("search")!;
        expect(index.byPath.get("$.context.action")?.checks).toEqual(["search/2"]);
        expect(index.below.get("$.context")).toBe(3);
        expect(index.byPath.get("$.message.intent.fulfillment.vehicle.category")).toEqual({
            checks: ["search/3"],
            guards: [],
        });
    });

    it("maps numbered apis to their tests", () => {
        expect(getTestKey({ on_search: 1 }, "on_search1")).toBe("on_search");
        expect(getTestKey({ on_search: 1 }, "on_select")).toBeUndefined();
    });

    it("flattens a tree depth first", () => {
        expect(flattenTests(model.tests.get("issue")!).map((t) => t.id)).toEqual([
            "issue/0",
            "issue/0.0",
            "issue/1",
            "issue/1.0",
        ]);
    });
});

describe("actions model", () => {
    const parsed = parseContract(fixture("trv11-actions.yaml"));
    const model = buildActionsModel(parsed);

    it("reads transitions, reverse transitions and properties", () => {
        expect(model.entry).toEqual(["search", "select", "init"]);
        expect(model.next.get("on_search")).toEqual(["search", "select", "init"]);
        expect(model.prev.get("init")).toEqual(["on_search", "on_select", "on_init"]);
        expect(model.props.get("on_select")).toMatchObject({
            asyncPredecessor: "select",
            partners: ["select"],
        });
        expect(model.apis).toContain("status");
    });

    it("edits through minimal patches", () => {
        const { parsed: after } = applyEdits(parsed, [
            ...toggleNext(model, "on_select", "confirm"),
            ...toggleNext(buildActionsModel(parsed), ENTRY_KEY, "init"),
        ]);
        const js = toPlain(after) as { supportedActions: Record<string, string[]> };
        expect(js.supportedActions.on_select).toEqual(["select", "init", "confirm"]);
        expect(js.supportedActions.null).toEqual(["search", "select"]);
    });

    it("adds properties for an api that has none", () => {
        const { parsed: after } = applyEdits(parsed, setAsyncPredecessor(model, "on_init", "init"));
        expect(
            (toPlain(after) as { apiProperties: Record<string, unknown> }).apiProperties.on_init
        ).toEqual({
            async_predecessor: "init",
            transaction_partner: [],
        });
        const partners = applyEdits(parsed, togglePartner(model, "status", "confirm")).parsed;
        expect(
            (toPlain(partners) as { apiProperties: { status: { transaction_partner: string[] } } })
                .apiProperties.status.transaction_partner
        ).toEqual(["init", "on_init", "confirm"]);
    });
});

describe("specs schema", () => {
    const spec = toPlain(parseContract(fixture("trv11-openapi.yaml"))) as SpecJson;

    it("lists apis with a request schema", () => {
        expect(getSpecApis(spec)).toEqual(["search", "on_search"]);
    });

    it("merges allOf, so context.action carries the api's enum", () => {
        const root = getSchemaRoot(spec, "search")!;
        const context = getSchemaChildren(spec, root).find((n) => n.key === "context")!;
        expect(context).toMatchObject({ path: "$.context", required: true, refName: "Context" });
        const action = getSchemaChildren(spec, context).find((n) => n.key === "action")!;
        expect(action).toMatchObject({
            path: "$.context.action",
            type: "string",
            enum: ["search"],
            required: true,
        });
    });

    it("walks arrays as [*] and stops at cycles", () => {
        const stops = findSchemaNode(spec, "search", "$.message.intent.fulfillment.stops")!;
        expect(stops).toMatchObject({ isArray: true, type: "object[]" });
        const parent = getSchemaChildren(spec, stops).find((n) => n.key === "parent_stop")!;
        expect(parent).toMatchObject({
            path: "$.message.intent.fulfillment.stops[*].parent_stop",
            refName: "Fulfillment",
            cyclic: true,
            hasChildren: false,
        });
    });

    it("marks oneOf properties partial and lists paths", () => {
        const providers = findSchemaNode(spec, "on_search", "$.message.catalog.providers")!;
        expect(providers.partial).toBe(true);
        expect(getSchemaChildren(spec, providers).map((n) => n.key)).toEqual(["id", "categories"]);
        expect(listSchemaPaths(spec, "search")).toContain(
            "$.message.intent.payment.tags[*].list[*].descriptor.code"
        );
    });

    it("knows which apis reach each component", () => {
        const users = buildRefUsers(spec);
        expect([...(users.get("Descriptor") ?? [])].sort()).toEqual(["on_search", "search"]);
        expect([...(users.get("Fulfillment") ?? [])]).toEqual(["search"]);
    });
});
