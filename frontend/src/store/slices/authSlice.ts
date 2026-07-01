import { createSlice } from "@reduxjs/toolkit";

export interface IAuthState {
    isAuthLoading: boolean;
    isOAuthExchangeInProgress: boolean;
}

const initialState: IAuthState = {
    isAuthLoading: true,
    isOAuthExchangeInProgress: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuthLoading: (state, action: { payload: boolean }) => {
            state.isAuthLoading = action.payload;
        },
        setOAuthExchangeInProgress: (state, action: { payload: boolean }) => {
            state.isOAuthExchangeInProgress = action.payload;
        },
    },
});

export const { setAuthLoading, setOAuthExchangeInProgress } = authSlice.actions;
export default authSlice;
