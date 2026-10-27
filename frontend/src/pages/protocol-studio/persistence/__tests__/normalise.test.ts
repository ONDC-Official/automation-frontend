import {
    migrateStudioDraft,
    STUDIO_DRAFT_VERSION,
    type StudioDraft,
} from "@store/slices/studioDraftSlice";
import {
    normaliseStudioGraph,
    normaliseStudioJourneys,
} from "@pages/protocol-studio/persistence/normalise";
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
