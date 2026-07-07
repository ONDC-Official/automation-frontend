import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IProfileShellState {
    /** Activity-history badge count — set when the user runs a profile history search. */
    activityHistoryCount: number;
}

const initialState: IProfileShellState = {
    activityHistoryCount: 0,
};

const profileShellSlice = createSlice({
    name: "profileShell",
    initialState,
    reducers: {
        setActivityHistoryCount: (state, action: PayloadAction<number>) => {
            state.activityHistoryCount = action.payload;
        },
        resetActivityHistoryCount: (state) => {
            state.activityHistoryCount = 0;
        },
    },
});

export const { setActivityHistoryCount, resetActivityHistoryCount } = profileShellSlice.actions;

export const selectActivityHistoryCount = (state: { profileShell: IProfileShellState }) =>
    state.profileShell.activityHistoryCount;

export default profileShellSlice;
