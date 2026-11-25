import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Durable auth credential only — `user` lives in the RTK Query `getMe` cache. */
export interface IAuthState {
    token: string | null;
    /**
     * True from "Login with GitHub" click through OAuth return + code exchange + getMe,
     * until the user profile is ready (or the attempt is abandoned / times out / fails).
     * Survives full-page navigation via redux-persist.
     */
    isLoginPending: boolean;
    /**
     * In-app path to open after a successful GitHub OAuth round-trip.
     * Cleared on logout, abandoned login, or after AuthInitializer navigates.
     */
    postLoginRedirect: string | null;
    /**
     * The organisation the user is working for (ONDC logins with several
     * organisations). Cleared on every new login and on logout, so the user picks
     * again after logging in.
     */
    activeOrgId: string | null;
}

const initialState: IAuthState = {
    token: null,
    isLoginPending: false,
    postLoginRedirect: null,
    activeOrgId: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            if (state.token !== action.payload) {
                // A new login: ask which organisation again.
                state.activeOrgId = null;
            }
            state.token = action.payload;
        },
        setActiveOrgId: (state, action: PayloadAction<string | null>) => {
            state.activeOrgId = action.payload;
        },
        setLoginPending: (state, action: PayloadAction<boolean>) => {
            state.isLoginPending = action.payload;
        },
        setPostLoginRedirect: (state, action: PayloadAction<string | null>) => {
            state.postLoginRedirect = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.isLoginPending = false;
            state.postLoginRedirect = null;
            state.activeOrgId = null;
        },
    },
});

export const { setToken, setLoginPending, setPostLoginRedirect, setActiveOrgId, clearAuth } =
    authSlice.actions;

export const selectAuthToken = (state: { auth: IAuthState }) => state.auth.token;
export const selectIsLoginPending = (state: { auth: IAuthState }) => state.auth.isLoginPending;
export const selectPostLoginRedirect = (state: { auth: IAuthState }) =>
    state.auth.postLoginRedirect;
export const selectActiveOrgId = (state: { auth: IAuthState }) => state.auth.activeOrgId;

export default authSlice;
