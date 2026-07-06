import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IFrameworkHealthState {
    isAuthenticated: boolean;
}

const initialState: IFrameworkHealthState = {
    isAuthenticated: false,
};

const frameworkHealthSlice = createSlice({
    name: "frameworkHealth",
    initialState,
    reducers: {
        setFrameworkHealthAuthenticated: (state, action: PayloadAction<boolean>) => {
            state.isAuthenticated = action.payload;
        },
    },
});

export const { setFrameworkHealthAuthenticated } = frameworkHealthSlice.actions;

export const selectFrameworkHealthAuthenticated = (state: {
    frameworkHealth: IFrameworkHealthState;
}) => state.frameworkHealth.isAuthenticated;

export default frameworkHealthSlice;
