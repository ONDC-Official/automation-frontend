import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Durable auth credential only — `user` lives in the RTK Query `getMe` cache. */
export interface IAuthState {
    token: string | null;
    /** True while a GitHub OAuth redirect is in flight (survives full-page navigation via persist). */
    isLoginPending: boolean;
}

const initialState: IAuthState = {
    token: null,
    isLoginPending: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setLoginPending: (state, action: PayloadAction<boolean>) => {
            state.isLoginPending = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.isLoginPending = false;
        },
    },
});

export const { setToken, setLoginPending, clearAuth } = authSlice.actions;

export const selectAuthToken = (state: { auth: IAuthState }) => state.auth.token;
export const selectIsLoginPending = (state: { auth: IAuthState }) => state.auth.isLoginPending;

export default authSlice;
