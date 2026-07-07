import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "@/types/user";

export interface IAuthState {
    token: string | null;
    user: IUser | undefined;
    isAuthLoading: boolean;
}

const initialState: IAuthState = {
    token: null,
    user: undefined,
    isAuthLoading: true,
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
        clearAuth: (state) => {
            state.token = null;
            state.user = undefined;
            state.isAuthLoading = false;
        },
    },
});

export const { setToken, setUser, setAuthLoading, clearAuth } = authSlice.actions;

export const selectAuthToken = (state: { auth: IAuthState }) => state.auth.token;
export const selectAuthUser = (state: { auth: IAuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: IAuthState }) => state.auth.isAuthLoading;

export default authSlice;
