import { useState } from "react";
import { toast } from "sonner";

import { buildDifficultyState } from "@components/DomainFlowRunner/FlowSettingsPanel";
import type {
    DifficultyCache,
    IFlowSettingsModalProps,
    SettingsDraft,
} from "@components/DomainFlowRunner/types";
import { usePutCacheDataMutation } from "@store/api";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    setAutoScrollEnabled,
    setFlowFilterTags,
    setStudioAdvancedMode,
    setStudioStepThrough,
} from "@store/slices/sessionSlice";
import { describeError } from "@pages/protocol-studio/live/use-live-run";

/** One empty list, so the selector's result is stable when no filter is set. */
const NO_TAGS: string[] = [];

export interface IUseLiveSettingsResult {
    /** Opens the settings dialog on the current values. */
    open: () => void;
    /** Props for v1's `FlowSettingsModal`, minus the page's own (tags, titles). */
    modalProps: Omit<IFlowSettingsModalProps, "flowTags">;
    autoScroll: boolean;
    /**
     * Step through: the mock sends one payload per click (what v1's Experimental Mode
     * did with manual steps). Studio's own preference, off by default and separate
     * from v1's switch; the mock is told on every start and proceed, and at once when
     * it changes.
     */
    stepThrough: boolean;
    /**
     * Advanced mode: the side panel also shows the run's Session data and the
     * mock's Log. This browser's view preference, off by default.
     */
    advancedMode: boolean;
    /** The dialog's Advanced mode switch, until Save. */
    advancedDraft: boolean;
    setAdvancedDraft: (value: boolean) => void;
    /** The journey tags the page is filtered to; empty for all journeys. */
    selectedTags: string[];
    clearTags: () => void;
}

/**
 * v1's flow settings for a Studio live session. The session validations are
 * `sessionDifficulty` on the session, which the api-service reads on every
 * request, saved with the same `PUT /sessions` as v1's dialog. Auto-scroll and
 * the journey filter are this browser's, kept in the session slice like v1's.
 */
export const useLiveSettings = (
    sessionId: string,
    sessionDifficulty: Partial<DifficultyCache> | undefined,
    /** Called after a save that changed step-through, to tell the open run. */
    onStepThroughChange: (value: boolean) => void
): IUseLiveSettingsResult => {
    const dispatch = useAppDispatch();
    const autoScroll = useAppSelector((state) => state.session.autoScrollEnabled);
    // `?? false`: a state rehydrated from before this preference existed lacks it.
    const stepThrough = useAppSelector((state) => state.session.studioStepThrough ?? false);
    const advancedMode = useAppSelector((state) => state.session.studioAdvancedMode ?? false);
    const selectedTags =
        useAppSelector((state) => state.session.flowFilterTagsBySessionId[sessionId]) ?? NO_TAGS;
    const [putCacheData] = usePutCacheDataMutation();
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<SettingsDraft | null>(null);
    const [advancedDraft, setAdvancedDraft] = useState(advancedMode);
    const [isSaving, setIsSaving] = useState(false);

    const open = () => {
        setDraft({
            autoScrollEnabled: autoScroll,
            // The dialog's Experimental Mode switch is Studio's step-through here.
            experimentalMode: stepThrough,
            sessionDifficulty: buildDifficultyState(sessionDifficulty ?? {}),
            selectedTags: [...selectedTags],
        });
        setAdvancedDraft(advancedMode);
        setIsOpen(true);
    };
    const close = () => {
        setIsOpen(false);
        setDraft(null);
    };
    const save = async () => {
        if (!draft) return;
        setIsSaving(true);
        try {
            await putCacheData({
                data: {
                    sessionDifficulty: { ...sessionDifficulty, ...draft.sessionDifficulty },
                },
                sessionId,
            }).unwrap();
            dispatch(setAutoScrollEnabled(draft.autoScrollEnabled));
            dispatch(setStudioAdvancedMode(advancedDraft));
            if (draft.experimentalMode !== stepThrough) {
                dispatch(setStudioStepThrough(draft.experimentalMode));
                onStepThroughChange(draft.experimentalMode);
            }
            dispatch(setFlowFilterTags({ sessionId, tags: draft.selectedTags }));
            close();
            toast.success("Settings saved");
        } catch (e) {
            // The dialog stays open with the draft, so nothing the tester set is lost.
            toast.error(`Settings were not saved · ${describeError(e)}`);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        open,
        modalProps: {
            isOpen,
            onClose: close,
            draft,
            onDraftChange: setDraft,
            onSave: save,
            isSaving,
        },
        autoScroll,
        stepThrough,
        advancedMode,
        advancedDraft,
        setAdvancedDraft,
        selectedTags,
        clearTags: () => dispatch(setFlowFilterTags({ sessionId, tags: [] })),
    };
};
