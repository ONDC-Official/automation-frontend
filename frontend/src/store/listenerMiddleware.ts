import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { sessionIdSupport } from "@utils/localStorageManager";
import {
    setSupportSession,
    setScenarioSession,
    setUnitSession,
    clearSupportSession,
} from "@store/slices/supportSessionSlice";
import type { RootState } from "@store/index";

export const listenerMiddleware = createListenerMiddleware();

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
