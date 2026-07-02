import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ICooldownEntry {
    progress: number;
    elapsed: number;
}

export interface ICooldownsState {
    entries: Record<string, ICooldownEntry>;
}

const initialState: ICooldownsState = {
    entries: {},
};

const cooldownsSlice = createSlice({
    name: "cooldowns",
    initialState,
    reducers: {
        setCooldown: (
            state,
            action: PayloadAction<{ id: string; progress: number; elapsed: number }>
        ) => {
            const { id, progress, elapsed } = action.payload;
            state.entries[id] = { progress, elapsed };
        },
        clearCooldown: (state, action: PayloadAction<string>) => {
            delete state.entries[action.payload];
        },
    },
});

export const { setCooldown, clearCooldown } = cooldownsSlice.actions;

export const selectCooldown = (id: string) => (state: { cooldowns: ICooldownsState }) =>
    state.cooldowns.entries[id];

export default cooldownsSlice;
