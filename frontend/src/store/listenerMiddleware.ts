import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { authTokenManager, sessionIdSupport } from "@utils/localStorageManager";
import { setToken, clearAuth } from "@store/slices/authSlice";
import {
    setSupportSession,
    setScenarioSession,
    setUnitSession,
    clearSupportSession,
} from "@store/slices/supportSessionSlice";
import type { RootState } from "@store/index";

export const listenerMiddleware = createListenerMiddleware();

// Auth token -> legacy authTokenManager write-through, so apiClient's interceptor keeps working
// without touching the API layer.
listenerMiddleware.startListening({
    matcher: isAnyOf(setToken, clearAuth),
    effect: (_action, api) => {
        const state = api.getState() as RootState;
        const token = state.auth.token;
        if (token) {
            authTokenManager.set(token);
        } else {
            authTokenManager.remove();
        }
    },
});

// Support session -> legacy sessionIdForSupport write-through for external support tooling.
listenerMiddleware.startListening({
    matcher: isAnyOf(setSupportSession, setScenarioSession, setUnitSession, clearSupportSession),
    effect: (_action, api) => {
        const state = api.getState() as RootState;
        const { unitSession, scenarioSession } = state.supportSession;
        if (!unitSession && !scenarioSession) {
            sessionIdSupport.remove();
        } else {
            sessionIdSupport.set({ unitSession, scenarioSession });
        }
    },
});
