import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ISupportSessionState {
    unitSession?: string;
    scenarioSession?: string;
}

const initialState: ISupportSessionState = {};

const supportSessionSlice = createSlice({
    name: "supportSession",
    initialState,
    reducers: {
        setSupportSession: (_state, action: PayloadAction<ISupportSessionState>) => {
            return { ..._state, ...action.payload };
        },
        setScenarioSession: (state, action: PayloadAction<string>) => {
            state.scenarioSession = action.payload;
        },
        setUnitSession: (state, action: PayloadAction<string>) => {
            state.unitSession = action.payload;
        },
        clearSupportSession: () => initialState,
    },
});

export const { setSupportSession, setScenarioSession, setUnitSession, clearSupportSession } =
    supportSessionSlice.actions;

export default supportSessionSlice;
