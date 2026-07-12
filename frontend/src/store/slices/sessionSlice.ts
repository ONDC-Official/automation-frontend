import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
    SessionCache,
    SessionMetadata,
    SessionPayloadData,
    SessionSideView,
} from "@/types/session-types";
import { SESSION_EMPTY_METADATA, SESSION_EMPTY_RECORD } from "@store/slices/sessionConstants";

export type SessionTab = "Request" | "Response" | "Metadata" | "Guide" | "Application";

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
    /** Per-session flow filter tags; keyed by sessionId for redux-persist. */
    flowFilterTagsBySessionId: Record<string, string[]>;
    flowFormDialogLockCount: number;
}

const initialState: ISessionState = {
    sessionId: "",
    activeFlowId: null,
    sessionData: null,
    selectedTab: "Request",
    requestData: SESSION_EMPTY_RECORD,
    responseData: SESSION_EMPTY_RECORD,
    sideView: null,
    metadata: SESSION_EMPTY_METADATA,
    activeCallClickedToggle: false,
    autoScrollEnabled: true,
    experimentalMode: false,
    flowFilterTagsBySessionId: {},
    flowFormDialogLockCount: 0,
};

function clearFlowRuntimeFields(state: ISessionState) {
    state.activeFlowId = null;
    state.sessionData = null;
    state.selectedTab = "Request";
    state.requestData = SESSION_EMPTY_RECORD;
    state.responseData = SESSION_EMPTY_RECORD;
    state.sideView = null;
    state.metadata = SESSION_EMPTY_METADATA;
    state.activeCallClickedToggle = false;
    state.flowFormDialogLockCount = 0;
}

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        setSessionId: (state, action: PayloadAction<string>) => {
            if (state.sessionId === action.payload) return;
            state.sessionId = action.payload;
        },
        setActiveFlowId: (state, action: PayloadAction<string | null>) => {
            if (state.activeFlowId === action.payload) return;
            state.activeFlowId = action.payload;
        },
        setSessionData: (state, action: PayloadAction<SessionCache | null>) => {
            if (state.sessionData === action.payload) return;
            state.sessionData = action.payload;
        },
        setSelectedTab: (state, action: PayloadAction<SessionTab>) => {
            if (state.selectedTab === action.payload) return;
            state.selectedTab = action.payload;
        },
        setRequestData: (state, action: PayloadAction<SessionPayloadData>) => {
            if (Object.is(state.requestData, action.payload)) return;
            state.requestData = action.payload;
        },
        setResponseData: (state, action: PayloadAction<SessionPayloadData>) => {
            if (Object.is(state.responseData, action.payload)) return;
            state.responseData = action.payload;
        },
        setSideView: (state, action: PayloadAction<SessionSideView>) => {
            if (Object.is(state.sideView, action.payload)) return;
            state.sideView = action.payload;
        },
        setMetadata: (state, action: PayloadAction<SessionMetadata>) => {
            if (Object.is(state.metadata, action.payload)) return;
            state.metadata = action.payload;
        },
        setActiveCallClickedToggle: (state, action: PayloadAction<boolean>) => {
            if (state.activeCallClickedToggle === action.payload) return;
            state.activeCallClickedToggle = action.payload;
        },
        setAutoScrollEnabled: (state, action: PayloadAction<boolean>) => {
            if (state.autoScrollEnabled === action.payload) return;
            state.autoScrollEnabled = action.payload;
        },
        setExperimentalMode: (state, action: PayloadAction<boolean>) => {
            if (state.experimentalMode === action.payload) return;
            state.experimentalMode = action.payload;
        },
        setFlowFilterTags: (
            state,
            action: PayloadAction<{ sessionId: string; tags: string[] }>
        ) => {
            const { sessionId, tags } = action.payload;
            state.flowFilterTagsBySessionId[sessionId] = tags;
        },
        acquireFlowFormDialogLock: (state) => {
            state.flowFormDialogLockCount += 1;
        },
        releaseFlowFormDialogLock: (state) => {
            state.flowFormDialogLockCount = Math.max(0, state.flowFormDialogLockCount - 1);
        },
        /** Mount flow page: set session id and reset ephemeral runtime (prefs preserved). */
        initializeFlowPage: (state, action: PayloadAction<string>) => {
            const { autoScrollEnabled, experimentalMode, flowFilterTagsBySessionId } = state;
            state.sessionId = action.payload;
            clearFlowRuntimeFields(state);
            state.autoScrollEnabled = autoScrollEnabled;
            state.experimentalMode = experimentalMode;
            state.flowFilterTagsBySessionId = flowFilterTagsBySessionId;
        },
        /** Clear flow-runtime fields; keep persisted UI prefs (autoScroll, experimental). */
        resetFlowRuntime: (state) => {
            const { autoScrollEnabled, experimentalMode, flowFilterTagsBySessionId } = state;
            state.sessionId = "";
            clearFlowRuntimeFields(state);
            state.autoScrollEnabled = autoScrollEnabled;
            state.experimentalMode = experimentalMode;
            state.flowFilterTagsBySessionId = flowFilterTagsBySessionId;
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
    setFlowFilterTags,
    acquireFlowFormDialogLock,
    releaseFlowFormDialogLock,
    initializeFlowPage,
    resetFlowRuntime,
    resetSession,
} = sessionSlice.actions;

export const selectIsFlowFormDialogOpen = (state: { session: ISessionState }) =>
    state.session.flowFormDialogLockCount > 0;

export const selectFlowFilterTags =
    (sessionId: string) =>
    (state: { session: ISessionState }): string[] =>
        state.session.flowFilterTagsBySessionId[sessionId] ?? [];

export default sessionSlice;
