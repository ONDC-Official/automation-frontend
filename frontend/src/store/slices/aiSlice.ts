import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AiSettings = {
    endpoint: string;
    model: string;
    inlineCompletionEnabled: boolean;
    useProxy: boolean;
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
    endpoint: "https://api.openai.com",
    model: "gpt-4o-mini",
    inlineCompletionEnabled: true,
    useProxy: false,
};

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
