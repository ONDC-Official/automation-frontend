import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IFlowTestingSessionEntry {
    sessionId: string;
    subscriberUrl: string;
    role: string;
    timestamp: string;
    expiresAt: string;
}

export interface ISessionHistoryState {
    sessions: IFlowTestingSessionEntry[];
}

const initialState: ISessionHistoryState = {
    sessions: [],
};

const sessionHistorySlice = createSlice({
    name: "sessionHistory",
    initialState,
    reducers: {
        setSessions: (state, action: PayloadAction<IFlowTestingSessionEntry[]>) => {
            state.sessions = action.payload;
        },
        upsertSession: (state, action: PayloadAction<IFlowTestingSessionEntry>) => {
            const entry = action.payload;
            const existingIndex = state.sessions.findIndex(
                (item) => item.sessionId === entry.sessionId
            );
            if (existingIndex !== -1) {
                state.sessions[existingIndex] = {
                    ...entry,
                    timestamp: state.sessions[existingIndex].timestamp,
                    expiresAt: state.sessions[existingIndex].expiresAt,
                };
            } else {
                state.sessions.push(entry);
            }
        },
        removeAllSessions: (state) => {
            state.sessions = [];
        },
        pruneExpiredSessions: (state) => {
            const now = Date.now();
            state.sessions = state.sessions.filter(
                (session) => new Date(session.expiresAt).getTime() > now
            );
        },
    },
});

export const { setSessions, upsertSession, removeAllSessions, pruneExpiredSessions } =
    sessionHistorySlice.actions;

export default sessionHistorySlice;
