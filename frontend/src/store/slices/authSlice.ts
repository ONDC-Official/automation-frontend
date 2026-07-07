import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Durable auth credential only — `user` lives in the RTK Query `getMe` cache. */
export interface IAuthState {
    token: string | null;
}

const initialState: IAuthState = {
    token: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
        },
    },
});

export const { setToken, clearAuth } = authSlice.actions;

export const selectAuthToken = (state: { auth: IAuthState }) => state.auth.token;

export default authSlice;
