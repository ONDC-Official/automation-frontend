import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// `user`/`isAuthLoading` deliberately do NOT live here: they're derived from the `getMe` RTK Query
// call and would just duplicate its cache. `AuthProvider` (context/authContext.ts) holds them as
// local state instead. This slice only owns the raw token, which legacy consumers (apiClient's
// interceptor via authTokenManager) read from localStorage, not from Redux.
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
