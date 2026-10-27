import { useCallback, useMemo, useRef, useState } from "react";

import { createJourney, getJourneyId } from "@pages/protocol-studio/ui/editor/journeys/derive";
import type { StudioJourney } from "@pages/protocol-studio/ui/editor/types";

/**
 * The Journeys list's built-in first entry: not a journey but a run mode. The
 * tester is asked at every fork; decisions decide themselves.
 */
export const OPEN_MODE_ID = "$open";

export interface StudioJourneyActions {
    /** Adds a journey titled `title` starting at `entry`; returns its id. */
    add: (title: string, entry: string, extra?: Partial<StudioJourney>) => string;
    /** Adds several at once (the Derive dialog). */
    addMany: (
        items: { title: string; entry: string; extra?: Partial<StudioJourney> }[]
    ) => string[];
    update: (id: string, patch: Partial<Omit<StudioJourney, "id">>) => void;
    remove: (id: string) => void;
    /** Resolves a fork of alternatives: the target node to take. */
    choose: (id: string, forkKey: string, targetId: string) => void;
    /** Records the case a journey expects a decision to return. */
    expect: (id: string, decisionId: string, caseValue: string) => void;
    /** Forgets a choice / expectation, so the fork is open again. */
    clear: (id: string, forkKey: string) => void;
    toggleOnDemand: (id: string, nodeId: string) => void;
    /** Marks an optional node as skipped by this journey, or runs it again. */
    toggleSkip: (id: string, nodeId: string) => void;
    select: (id: string | null) => void;
}

/**
 * The journeys extracted from the protocol, and which one the Journeys stage
 * shows. React state, seeded from the local draft when there is one; the
 * editor writes every change back to the draft (see `persistence/studio-draft.ts`).
 */
export const useStudioJourneys = (initial: StudioJourney[] = []) => {
    const [journeys, setJourneys] = useState<StudioJourney[]>(initial);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const journeysRef = useRef(journeys);
    journeysRef.current = journeys;

    const update = useCallback((recipe: (prev: StudioJourney[]) => StudioJourney[]) => {
        setJourneys((prev) => {
            const next = recipe(prev);
            journeysRef.current = next;
            return next;
        });
    }, []);

    const actions = useMemo<StudioJourneyActions>(() => {
        const patchOne = (id: string, fn: (journey: StudioJourney) => StudioJourney) =>
            update((prev) => prev.map((journey) => (journey.id === id ? fn(journey) : journey)));

        const add: StudioJourneyActions["add"] = (title, entry, extra) => {
            const id = getJourneyId(title, new Set(journeysRef.current.map((j) => j.id)));
            update((prev) => [...prev, createJourney(id, title, entry, extra)]);
            return id;
        };

        return {
            add,
            addMany: (items) => {
                const taken = new Set(journeysRef.current.map((j) => j.id));
                const created: StudioJourney[] = [];
                for (const item of items) {
                    const id = getJourneyId(item.title, taken);
                    taken.add(id);
                    created.push(createJourney(id, item.title, item.entry, item.extra));
                }
                update((prev) => [...prev, ...created]);
                return created.map((j) => j.id);
            },
            update: (id, patch) => patchOne(id, (journey) => ({ ...journey, ...patch })),
            remove: (id) => {
                update((prev) => prev.filter((journey) => journey.id !== id));
                setSelectedId((current) => (current === id ? null : current));
            },
            choose: (id, forkKey, targetId) =>
                patchOne(id, (journey) => ({
                    ...journey,
                    choices: { ...journey.choices, [forkKey]: targetId },
                })),
            expect: (id, decisionId, caseValue) =>
                patchOne(id, (journey) => ({
                    ...journey,
                    expects: { ...journey.expects, [decisionId]: caseValue },
                })),
            clear: (id, forkKey) =>
                patchOne(id, (journey) => {
                    const choices = { ...journey.choices };
                    const expects = { ...journey.expects };
                    delete choices[forkKey];
                    delete expects[forkKey.replace(/:decision$/, "")];
                    return { ...journey, choices, expects };
                }),
            toggleOnDemand: (id, nodeId) =>
                patchOne(id, (journey) => ({
                    ...journey,
                    onDemand: journey.onDemand.includes(nodeId)
                        ? journey.onDemand.filter((n) => n !== nodeId)
                        : [...journey.onDemand, nodeId],
                })),
            toggleSkip: (id, nodeId) =>
                patchOne(id, (journey) => {
                    const skips = journey.skips ?? [];
                    return {
                        ...journey,
                        skips: skips.includes(nodeId)
                            ? skips.filter((n) => n !== nodeId)
                            : [...skips, nodeId],
                    };
                }),
            select: setSelectedId,
        };
    }, [update]);

    const selected = useMemo(
        () => journeys.find((journey) => journey.id === selectedId) ?? null,
        [journeys, selectedId]
    );

    return { journeys, selectedId, selected, isOpenMode: selectedId === OPEN_MODE_ID, actions };
};

export default useStudioJourneys;
