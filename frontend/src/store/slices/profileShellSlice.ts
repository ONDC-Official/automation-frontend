import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IProfileCounts {
    configs: number;
    pastReports: number;
    history: number;
}

export interface IProfileShellState {
    counts: IProfileCounts;
}

const initialState: IProfileShellState = {
    counts: { configs: 0, pastReports: 0, history: 0 },
};

const profileShellSlice = createSlice({
    name: "profileShell",
    initialState,
    reducers: {
        setCounts: (state, action: PayloadAction<IProfileCounts>) => {
            state.counts = action.payload;
        },
    },
});

export const { setCounts } = profileShellSlice.actions;

export const selectProfileCounts = (state: { profileShell: IProfileShellState }) =>
    state.profileShell.counts;

export default profileShellSlice;
