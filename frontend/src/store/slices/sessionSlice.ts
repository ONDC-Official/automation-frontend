import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SessionCache } from "@/types/session-types";

export type SessionTab = "Request" | "Response" | "Metadata" | "Guide" | "Application";

type SessionPayloadData = Record<string, unknown> | unknown[] | null;
type SessionSideView = Record<string, unknown> | null;
type SessionMetadataValue = { name?: string; value: unknown; errorMessage?: string };
type SessionMetadata = Record<string, SessionMetadataValue> | null;

export interface ISessionState {
    sessionId: string;
    activeFlowId: string | null;
    sessionData: SessionCache | null;
    selectedTab: SessionTab;
    requestData: SessionPayloadData;
    responseData: SessionPayloadData;
    sideView: SessionSideView;
    metadata: SessionMetadata;
    activeCallClickedToggle: boolean;
    autoScrollEnabled: boolean;
    experimentalMode: boolean;
    flowFormDialogLockCount: number;
}

const initialState: ISessionState = {
    sessionId: "",
    activeFlowId: null,
    sessionData: null,
    selectedTab: "Request",
    requestData: null,
    responseData: null,
    sideView: null,
    metadata: null,
    activeCallClickedToggle: false,
    autoScrollEnabled: true,
    experimentalMode: false,
    flowFormDialogLockCount: 0,
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
        setSessionData: (state, action: PayloadAction<SessionCache | null>) => {
            state.sessionData = action.payload;
        },
        setSelectedTab: (state, action: PayloadAction<SessionTab>) => {
            state.selectedTab = action.payload;
        },
        setRequestData: (state, action: PayloadAction<SessionPayloadData>) => {
            state.requestData = action.payload;
        },
        setResponseData: (state, action: PayloadAction<SessionPayloadData>) => {
            state.responseData = action.payload;
        },
        setSideView: (state, action: PayloadAction<SessionSideView>) => {
            state.sideView = action.payload;
        },
        setMetadata: (state, action: PayloadAction<SessionMetadata>) => {
            state.metadata = action.payload;
        },
        setActiveCallClickedToggle: (state, action: PayloadAction<boolean>) => {
            state.activeCallClickedToggle = action.payload;
        },
        setAutoScrollEnabled: (state, action: PayloadAction<boolean>) => {
            state.autoScrollEnabled = action.payload;
        },
        setExperimentalMode: (state, action: PayloadAction<boolean>) => {
            state.experimentalMode = action.payload;
        },
        acquireFlowFormDialogLock: (state) => {
            state.flowFormDialogLockCount += 1;
        },
        releaseFlowFormDialogLock: (state) => {
            state.flowFormDialogLockCount = Math.max(0, state.flowFormDialogLockCount - 1);
        },
        resetSession: () => initialState,
    },
});

export const {
    setSessionId,
    setActiveFlowId,
    setSessionData,
    setSelectedTab,
    setRequestData,
    setResponseData,
    setSideView,
    setMetadata,
    setActiveCallClickedToggle,
    setAutoScrollEnabled,
    setExperimentalMode,
    acquireFlowFormDialogLock,
    releaseFlowFormDialogLock,
    resetSession,
} = sessionSlice.actions;

export const selectIsFlowFormDialogOpen = (state: { session: ISessionState }) =>
    state.session.flowFormDialogLockCount > 0;

export default sessionSlice;
