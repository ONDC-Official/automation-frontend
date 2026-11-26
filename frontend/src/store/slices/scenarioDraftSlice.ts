import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** A form's in-progress values (plain strings), kept so a page refresh doesn't lose them. */
export type ScenarioFormDraft = Record<string, string>;

export interface IScenarioDraftState {
    /** The New session form being filled in. */
    newSession: ScenarioFormDraft | null;
    /** The "Fill in to launch" values, keyed by config id. */
    fillByConfig: Record<string, ScenarioFormDraft>;
    /** The config open on the right, so it stays selected after a refresh. */
    selectedConfigId: string | null;
}

const initialState: IScenarioDraftState = {
    newSession: null,
    fillByConfig: {},
    selectedConfigId: null,
};

const scenarioDraftSlice = createSlice({
    name: "scenarioDraft",
    initialState,
    reducers: {
        setNewSessionDraft: (state, action: PayloadAction<ScenarioFormDraft>) => {
            state.newSession = action.payload;
        },
        clearNewSessionDraft: (state) => {
            state.newSession = null;
        },
        setConfigFillDraft: (
            state,
            action: PayloadAction<{ configId: string; values: ScenarioFormDraft }>
        ) => {
            state.fillByConfig[action.payload.configId] = action.payload.values;
        },
        clearConfigFillDraft: (state, action: PayloadAction<string>) => {
            delete state.fillByConfig[action.payload];
        },
        setScenarioSelectedConfig: (state, action: PayloadAction<string | null>) => {
            state.selectedConfigId = action.payload;
        },
    },
});

export const {
    setNewSessionDraft,
    clearNewSessionDraft,
    setConfigFillDraft,
    clearConfigFillDraft,
    setScenarioSelectedConfig,
} = scenarioDraftSlice.actions;

export default scenarioDraftSlice;
