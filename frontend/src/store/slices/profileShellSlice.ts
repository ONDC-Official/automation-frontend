import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IProfileCounts } from "@pages/user-profile/types";

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
