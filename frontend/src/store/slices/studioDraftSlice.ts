import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

import {
    normaliseStudioGraph,
    normaliseStudioJourneys,
} from "@pages/protocol-studio/persistence/normalise";
import type { StudioDraftContent } from "@pages/protocol-studio/ui/editor/types";

/**
 * Protocol Studio's local draft: the one config being worked on, with its
 * graph, journeys and helpers, persisted (key `persist:studioDraft`) so a
 * reload resumes where the user was.
 *
 * Deliberately the simplest thing that survives a refresh while the graph /
 * journey schema is still moving: one draft, one blob, a schema version.
 * Bump `STUDIO_DRAFT_VERSION` when the shape changes, and add the old
 * version to `MIGRATIONS` when its drafts can be brought forward; the first
 * save afterwards *parks* the old draft (kept under `parked`, not deleted) so
 * nothing is lost. A draft of a version with no migration is not loaded. Separate from the v1
 * `playgroundConfigs` slice on purpose: its metadata requires a flowId, and
 * Studio configs span every flow of a domain (see `/CLAUDE.md`, "Backward
 * Compatibility"). Several saved configs, Load Saved and GitHub import come
 * later, as additions to this slice.
 */
export const STUDIO_DRAFT_VERSION = 2;

export interface StudioDraft extends StudioDraftContent {
    /** The schema version this draft was written with. */
    version: number;
    /** ISO timestamp of the last write. */
    savedAt: string;
    config: MockPlaygroundConfigV2Type;
}

export interface IStudioDraftState {
    draft: StudioDraft | null;
    /** A draft written with another schema version, set aside rather than dropped. */
    parked: StudioDraft | null;
}

const initialState: IStudioDraftState = { draft: null, parked: null };

const studioDraftSlice = createSlice({
    name: "studioDraft",
    initialState,
    reducers: {
        saveStudioDraft: (
            state,
            action: PayloadAction<Omit<StudioDraft, "version" | "savedAt">>
        ) => {
            if (state.draft && state.draft.version !== STUDIO_DRAFT_VERSION)
                state.parked = state.draft;
            state.draft = {
                ...action.payload,
                version: STUDIO_DRAFT_VERSION,
                savedAt: new Date().toISOString(),
            };
        },
        clearStudioDraft: (state) => {
            if (state.draft && state.draft.version !== STUDIO_DRAFT_VERSION)
                state.parked = state.draft;
            state.draft = null;
        },
    },
});

export const { saveStudioDraft, clearStudioDraft } = studioDraftSlice.actions;

/**
 * Brings a draft of an older version to the current one, by version.
 * - 1 → 2 (2026-10-27): `switch` nodes renamed `decision`; `guard` / `effects` retired.
 */
const MIGRATIONS: Record<number, (draft: StudioDraft) => StudioDraft> = {
    1: (draft) => ({
        ...draft,
        graph: normaliseStudioGraph(draft.graph),
        journeys: normaliseStudioJourneys(draft.journeys),
        version: 2,
    }),
};

/** `draft` at the current version, migrated step by step; null when no migration reaches it. */
export const migrateStudioDraft = (draft: StudioDraft | null): StudioDraft | null => {
    let current = draft;
    while (current && current.version !== STUDIO_DRAFT_VERSION) {
        const migrate = MIGRATIONS[current.version];
        current = migrate ? migrate(current) : null;
    }
    return current;
};

/** The draft at the current schema version (an older one migrated, memoised); else null. */
export const selectStudioDraft = createSelector(
    [(state: { studioDraft: IStudioDraftState }) => state.studioDraft.draft],
    migrateStudioDraft
);

export default studioDraftSlice;
