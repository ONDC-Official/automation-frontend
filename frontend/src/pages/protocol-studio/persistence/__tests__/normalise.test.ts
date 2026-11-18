import {
    migrateStudioDraft,
    STUDIO_DRAFT_VERSION,
    type StudioDraft,
} from "@store/slices/studioDraftSlice";
import {
    normaliseStudioGraph,
    normaliseStudioJourneys,
} from "@pages/protocol-studio/persistence/normalise";
import {
    readStudioProjectFile,
    toStudioProjectFile,
} from "@pages/protocol-studio/persistence/project-file";
import type { StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/** A graph as Studio wrote it before 2026-10-27: a `switch` node, guards and effects. */
const legacyGraph = {
    nodes: [
        {
            id: "on_confirm",
            api: "on_confirm",
            kind: "callback",
            effects: [{ set: "state.order", to: "ACCEPTED" }],
            guard: { "state.order": "CREATED" },
        },
        {
            id: "pay",
            api: "switch",
            kind: "switch",
            effects: [],
            switch: { cases: ["PREPAID", "COD"], decide: "x" },
        },
        {
            id: "grp",
            api: "group",
            kind: "group",
            effects: [],
            group: {
                name: "g",
                description: "d",
                graph: {
                    nodes: [
                        {
                            id: "inner",
                            api: "switch",
                            kind: "switch",
                            effects: [],
                            switch: { cases: ["a"], decide: "" },
                        },
                    ],
                    edges: [],
                },
            },
        },
    ],
    edges: [
        { id: "e1", from: "pay", to: "on_confirm", kind: "branch", case: "COD", mandated: true },
    ],
};

describe("normaliseStudioGraph", () => {
    it("renames switch nodes to decisions and drops guard / effects, at every level", () => {
        const graph = normaliseStudioGraph(legacyGraph);
        const [onConfirm, pay, grp] = graph.nodes;
        expect(onConfirm).not.toHaveProperty("guard");
        expect(onConfirm).not.toHaveProperty("effects");
        expect(pay).toMatchObject({
            kind: "decision",
            api: "decision",
            decision: { cases: ["PREPAID", "COD"], decide: "x" },
        });
        expect(pay).not.toHaveProperty("switch");
        expect(grp.group?.graph.nodes[0]).toMatchObject({
            kind: "decision",
            decision: { cases: ["a"] },
        });
        expect(graph.edges).toEqual(legacyGraph.edges);
    });

    it("leaves a current graph as it is", () => {
        const current = normaliseStudioGraph(legacyGraph);
        expect(normaliseStudioGraph(current)).toEqual(current);
    });

    it("renames a decision's fork key in journey choices", () => {
        const journeys = [
            { id: "j", choices: { "pay:switch": "x", select: "on_select" } },
        ] as unknown as StudioJourney[];
        expect(normaliseStudioJourneys(journeys)[0].choices).toEqual({
            "pay:decision": "x",
            select: "on_select",
        });
    });
});

describe("migrateStudioDraft", () => {
    it("brings a version-1 draft to the current version", () => {
        const draft = {
            version: 1,
            savedAt: "2026-10-23T00:00:00.000Z",
            config: {},
            graph: legacyGraph,
            journeys: [],
            helpers: "",
        } as unknown as StudioDraft;
        const migrated = migrateStudioDraft(draft);
        expect(migrated?.version).toBe(STUDIO_DRAFT_VERSION);
        expect(migrated?.graph.nodes[1]).toMatchObject({ kind: "decision" });
    });

    it("drops a draft of a version it cannot migrate", () => {
        expect(migrateStudioDraft({ version: 99 } as unknown as StudioDraft)).toBeNull();
    });
});

describe("Studio project file", () => {
    const config = {
        meta: { domain: "ONDC:TRV11", version: "2.1.0", use_case_id: "metro" },
        helperLib: "",
    } as unknown as StudioDraft["config"];
    const content = {
        config,
        graph: normaliseStudioGraph(legacyGraph),
        journeys: [
            { id: "j", title: "J", choices: { select: "on_select" } },
        ] as unknown as StudioJourney[],
        helpers: "export const x = 1;",
    };

    it("round-trips the draft's content", () => {
        const file = toStudioProjectFile(content);
        expect(file).toMatchObject({ kind: "studio-project", version: STUDIO_DRAFT_VERSION });
        const read = readStudioProjectFile(JSON.stringify(file));
        expect(read).toEqual({ ok: true, content });
    });

    it("migrates and normalises a file written at an older version", () => {
        const read = readStudioProjectFile(
            JSON.stringify({
                kind: "studio-project",
                version: 1,
                config,
                graph: legacyGraph,
                journeys: [{ id: "j", choices: { "pay:switch": "x" } }],
                helpers: "",
            })
        );
        if (!read.ok) throw new Error(read.error);
        expect(read.content.graph.nodes[1]).toMatchObject({ kind: "decision" });
        expect(read.content.graph.nodes[0]).not.toHaveProperty("effects");
        expect(read.content.journeys[0].choices).toEqual({ "pay:decision": "x" });
    });

    it("refuses what it can't open", () => {
        expect(readStudioProjectFile("{nope").ok).toBe(false);
        expect(readStudioProjectFile(JSON.stringify({ ...content, version: 2 })).ok).toBe(false);
        expect(
            readStudioProjectFile(JSON.stringify({ ...toStudioProjectFile(content), version: 99 }))
        ).toMatchObject({ ok: false, error: expect.stringContaining("version 99") });
        expect(
            readStudioProjectFile(
                JSON.stringify({ ...toStudioProjectFile(content), config: undefined })
            ).ok
        ).toBe(false);
    });
});
