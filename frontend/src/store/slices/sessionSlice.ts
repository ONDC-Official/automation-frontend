import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SessionTab = "Request" | "Response" | "Metadata" | "Guide" | "Application";

export interface ISessionState {
    sessionId: string;
    activeFlowId: string | null;
    selectedTab: SessionTab;
}

const initialState: ISessionState = {
    sessionId: "",
    activeFlowId: null,
    selectedTab: "Request",
};

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
        setActiveFlowId: (state, action: PayloadAction<string | null>) => {
            state.activeFlowId = action.payload;
        },
        setSelectedTab: (state, action: PayloadAction<SessionTab>) => {
            state.selectedTab = action.payload;
        },
    },
});

export const { setSessionId, setActiveFlowId, setSelectedTab } = sessionSlice.actions;
export default sessionSlice;
