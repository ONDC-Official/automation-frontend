import type { MockPlaygroundConfigV2Type } from "@ondc/automation-mock-runner";

import {
    normaliseStudioGraph,
    normaliseStudioJourneys,
} from "@pages/protocol-studio/persistence/normalise";
import { decodeHelpers } from "@pages/protocol-studio/ui/editor/flows/action-files";
import type { StudioDraftContent } from "@pages/protocol-studio/ui/editor/types";
import {
    migrateStudioDraft,
    STUDIO_DRAFT_VERSION,
    type StudioDraft,
} from "@store/slices/studioDraftSlice";

/** What a downloaded Studio project file says it is. */
export const STUDIO_PROJECT_KIND = "studio-project";

/** The draft's content, as `saveStudioDraft` takes it. */
export type StudioProjectContent = Omit<StudioDraft, "version" | "savedAt">;

/**
 * A Studio project as a file: everything the local draft holds (the config,
 * graph, journeys and helpers), with the draft's schema version, so a draft
 * that can't be kept in this browser can be downloaded and opened again.
 */
export interface StudioProjectFile extends StudioDraftContent {
    kind: typeof STUDIO_PROJECT_KIND;
    version: number;
    config: MockPlaygroundConfigV2Type;
}

/** The project file for this content, at the current draft version. */
export const toStudioProjectFile = ({
    config,
    graph,
    journeys,
    helpers,
}: StudioProjectContent): StudioProjectFile => ({
    kind: STUDIO_PROJECT_KIND,
    version: STUDIO_DRAFT_VERSION,
    config,
    graph,
    journeys,
    helpers,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A project file's text as draft content: checked, brought to the current
 * draft version (`migrateStudioDraft`) and normalised, the way a persisted
 * draft is. An error says why a file can't be opened.
 */
export const readStudioProjectFile = (
    text: string
): { ok: true; content: StudioProjectContent } | { ok: false; error: string } => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return { ok: false, error: "This file isn't JSON" };
    }
    if (!isRecord(parsed) || parsed.kind !== STUDIO_PROJECT_KIND) {
        return {
            ok: false,
            error: "This isn't a Studio project file (Download project saves one)",
        };
    }
    if (typeof parsed.version !== "number") {
        return { ok: false, error: "The project file has no version" };
    }
    const config = parsed.config;
    if (!isRecord(config) || !isRecord(config.meta)) {
        return { ok: false, error: "The project file has no config" };
    }
    const migrated = migrateStudioDraft({
        ...(parsed as unknown as StudioDraft),
        savedAt: new Date().toISOString(),
    });
    if (!migrated) {
        return {
            ok: false,
            error: `The project file was written by a Studio this one can't read (version ${parsed.version})`,
        };
    }
    return {
        ok: true,
        content: {
            config: migrated.config,
            graph: normaliseStudioGraph(migrated.graph),
            journeys: normaliseStudioJourneys(migrated.journeys),
            // Without helpers.ts, the config's own helpers, as the editor reads them.
            helpers:
                typeof migrated.helpers === "string"
                    ? migrated.helpers
                    : decodeHelpers(migrated.config.helperLibTs ?? migrated.config.helperLib),
        },
    };
};
