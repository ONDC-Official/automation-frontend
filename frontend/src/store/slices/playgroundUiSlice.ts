import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { StepGroup } from "@pages/protocol-playground/utils/step-group";
import type { PlaygroundRightTabType } from "@pages/protocol-playground/types";

/**
 * Persisted playground *navigation* state — the "where was I" view state that
 * lets a user return to exactly the screen they left (selected step, active
 * tabs, timeline visibility). The config content itself lives in
 * `playgroundConfigs.draft`; this slice only tracks how that config is being
 * viewed. Transient state (loading, modal-open flags, drag) stays component-local.
 */
export interface IPlaygroundUiState {
    activeApi: string | null;
    stepGroup: StepGroup;
    activeRightTab: PlaygroundRightTabType;
    activeLeftTab: string | null;
    isTimelineOpen: boolean;
}

const initialState: IPlaygroundUiState = {
    activeApi: null,
    stepGroup: "main",
    activeRightTab: "session",
    activeLeftTab: null,
    isTimelineOpen: true,
};

const playgroundUiSlice = createSlice({
    name: "playgroundUi",
    initialState,
    reducers: {
        setActiveApi: (state, action: PayloadAction<string | null>) => {
            state.activeApi = action.payload;
        },
        setStepGroup: (state, action: PayloadAction<StepGroup>) => {
            state.stepGroup = action.payload;
        },
        setActiveRightTab: (state, action: PayloadAction<PlaygroundRightTabType>) => {
            state.activeRightTab = action.payload;
        },
        setActiveLeftTab: (state, action: PayloadAction<string | null>) => {
            state.activeLeftTab = action.payload;
        },
        setTimelineOpen: (state, action: PayloadAction<boolean>) => {
            state.isTimelineOpen = action.payload;
        },
        resetPlaygroundUi: () => initialState,
    },
});

export const {
    setActiveApi,
    setStepGroup,
    setActiveRightTab,
    setActiveLeftTab,
    setTimelineOpen,
    resetPlaygroundUi,
} = playgroundUiSlice.actions;

export default playgroundUiSlice;
