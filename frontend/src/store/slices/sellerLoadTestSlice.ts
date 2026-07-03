import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ISellerSessionData {
    sessionId: string;
    bppId: string;
    bppUri: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

export interface ISellerLoadTestState {
    session: ISellerSessionData | null;
}

const initialState: ISellerLoadTestState = {
    session: null,
};

const sellerLoadTestSlice = createSlice({
    name: "sellerLoadTest",
    initialState,
    reducers: {
        setSellerSession: (state, action: PayloadAction<ISellerSessionData | null>) => {
            state.session = action.payload;
        },
    },
});

export const { setSellerSession } = sellerLoadTestSlice.actions;

export const selectSellerSession = (state: { sellerLoadTest: ISellerLoadTestState }) =>
    state.sellerLoadTest.session;

export default sellerLoadTestSlice;
