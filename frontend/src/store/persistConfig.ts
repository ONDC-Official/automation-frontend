import { storage, sessionStorage } from "@store/storage";
import { idbStorage } from "@store/idbStorage";
import type { PersistConfig } from "redux-persist";
import type { ISessionState } from "@store/slices/sessionSlice";
import type { IFrameworkHealthState } from "@store/slices/frameworkHealthSlice";
import type { IAuthState } from "@store/slices/authSlice";
import type { IStudioContractsState } from "@store/slices/studioContractsSlice";
import type { IStudioDraftState } from "@store/slices/studioDraftSlice";

/** Persist only the frontend-only UI prefs from the session slice. */
export const sessionPersistConfig: PersistConfig<ISessionState> = {
    key: "session",
    storage,
    whitelist: [
        "autoScrollEnabled",
        "experimentalMode",
        "studioStepThrough",
        "studioAdvancedMode",
        "flowFilterTagsBySessionId",
    ],
};

/** Framework-health admin auth flag lives in sessionStorage (per-tab), matching legacy behavior. */
export const frameworkHealthPersistConfig: PersistConfig<IFrameworkHealthState> = {
    key: "frameworkHealth",
    storage: sessionStorage,
};

/** Persist auth token and in-flight OAuth flag — user profile is owned by the RTK Query `getMe` cache. */
export const authPersistConfig: PersistConfig<IAuthState> = {
    key: "auth",
    storage,
    whitelist: ["token", "isLoginPending", "postLoginRedirect"],
};

/**
 * Fired on `window` when a Studio slice couldn't be written (storage full);
 * the page tells the user. `detail` is the slice: "studioContracts" or "studioDraft".
 */
export const STUDIO_PERSIST_FAILED_EVENT = "studio:persist-failed";

const reportPersistFailure = (slice: "studioContracts" | "studioDraft") => () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(STUDIO_PERSIST_FAILED_EVENT, { detail: slice }));
    }
};

/**
 * Studio's local draft (config, graph, journeys, helpers). Stays on
 * localStorage: the editor flushes it synchronously as the page goes away, and
 * the ui e2e seeds it there. A failed write is reported, so the editor can
 * offer the project as a download instead.
 */
export const studioDraftPersistConfig: PersistConfig<IStudioDraftState> = {
    key: "studioDraft",
    storage,
    writeFailHandler: reportPersistFailure("studioDraft"),
};

/**
 * Studio's contract files can be large (an edited validations file is ~300 KB),
 * so they live in IndexedDB (`idbStorage`; localStorage where it is missing),
 * and a failed write is reported rather than silently lost. `timeout: 0`:
 * rehydration waits for IndexedDB, which always settles (its open is capped),
 * instead of giving up after 5 s and later overwriting what is stored.
 */
export const studioContractsPersistConfig: PersistConfig<IStudioContractsState> = {
    key: "studioContracts",
    storage: idbStorage,
    timeout: 0,
    writeFailHandler: reportPersistFailure("studioContracts"),
};
