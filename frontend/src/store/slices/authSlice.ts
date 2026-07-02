import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "@/types/user";

export interface IAuthState {
    token: string | null;
    user: IUser | undefined;
    isAuthLoading: boolean;
    isOAuthExchangeInProgress: boolean;
}

const initialState: IAuthState = {
    token: null,
    user: undefined,
    isAuthLoading: true,
    isOAuthExchangeInProgress: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setUser: (state, action: PayloadAction<IUser | undefined>) => {
            state.user = action.payload;
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.isAuthLoading = action.payload;
        },
        setOAuthExchangeInProgress: (state, action: PayloadAction<boolean>) => {
            state.isOAuthExchangeInProgress = action.payload;
        },
        clearAuth: (state) => {
            state.token = null;
            state.user = undefined;
            state.isAuthLoading = false;
            state.isOAuthExchangeInProgress = false;
        },
    },
});

export const { setToken, setUser, setAuthLoading, setOAuthExchangeInProgress, clearAuth } =
    authSlice.actions;

export const selectAuthUser = (state: { auth: IAuthState }) => state.auth.user;
export const selectIsAuthLoading = (state: { auth: IAuthState }) => state.auth.isAuthLoading;
export const selectAuthToken = (state: { auth: IAuthState }) => state.auth.token;

export default authSlice;
