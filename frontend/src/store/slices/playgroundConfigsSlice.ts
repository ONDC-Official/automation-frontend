import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

export interface SavedConfigMetadata {
    domain: string;
    version: string;
    flowId: string;
    savedAt: string;
    configId: string;
}

export interface SavedConfig extends SavedConfigMetadata {
    config: MockPlaygroundConfigType;
}

export interface IPlaygroundConfigsState {
    configs: Record<string, SavedConfig>;
    metadata: SavedConfigMetadata[];
    /** The current in-progress playground config (formerly the `playgroundConfig` localStorage key). */
    draft: MockPlaygroundConfigType | null;
}

const initialState: IPlaygroundConfigsState = {
    configs: {},
    metadata: [],
    draft: null,
};

const toMetadata = (config: SavedConfig): SavedConfigMetadata => ({
    domain: config.domain,
    version: config.version,
    flowId: config.flowId,
    configId: config.configId,
    savedAt: config.savedAt,
});

const playgroundConfigsSlice = createSlice({
    name: "playgroundConfigs",
    initialState,
    reducers: {
        upsertConfig: (state, action: PayloadAction<SavedConfig>) => {
            const config = action.payload;
            state.configs[config.configId] = config;
            const existingIndex = state.metadata.findIndex((m) => m.configId === config.configId);
            if (existingIndex >= 0) {
                state.metadata[existingIndex] = toMetadata(config);
            } else {
                state.metadata.push(toMetadata(config));
            }
        },
        removeConfig: (state, action: PayloadAction<string>) => {
            delete state.configs[action.payload];
            state.metadata = state.metadata.filter((m) => m.configId !== action.payload);
        },
        clearConfigs: (state) => {
            state.configs = {};
            state.metadata = [];
        },
        setDraftConfig: (state, action: PayloadAction<MockPlaygroundConfigType | null>) => {
            state.draft = action.payload;
        },
        importConfigs: (state, action: PayloadAction<SavedConfig[]>) => {
            for (const config of action.payload) {
                state.configs[config.configId] = config;
                const existingIndex = state.metadata.findIndex(
                    (m) => m.configId === config.configId
                );
                if (existingIndex >= 0) {
                    state.metadata[existingIndex] = toMetadata(config);
                } else {
                    state.metadata.push(toMetadata(config));
                }
            }
        },
    },
});

export const { upsertConfig, removeConfig, clearConfigs, importConfigs, setDraftConfig } =
    playgroundConfigsSlice.actions;

export default playgroundConfigsSlice;
