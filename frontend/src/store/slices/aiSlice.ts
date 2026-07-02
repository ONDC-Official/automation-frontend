import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_AI_SETTINGS } from "@pages/protocol-playground/ai/constants";
import type { AiSettings } from "@pages/protocol-playground/ai/context/ai-context";

export interface IAiState {
    settings: AiSettings;
}

const initialState: IAiState = {
    settings: DEFAULT_AI_SETTINGS,
};

const aiSlice = createSlice({
    name: "ai",
    initialState,
    reducers: {
        setAiSettings: (state, action: PayloadAction<AiSettings>) => {
            state.settings = action.payload;
        },
        updateAiSettings: (state, action: PayloadAction<Partial<AiSettings>>) => {
            state.settings = { ...state.settings, ...action.payload };
        },
    },
});

export const { setAiSettings, updateAiSettings } = aiSlice.actions;

export const selectAiSettings = (state: { ai: IAiState }) => state.ai.settings;

export default aiSlice;
