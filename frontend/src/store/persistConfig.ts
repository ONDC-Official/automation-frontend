import { storage, sessionStorage } from "@store/storage";
import type { PersistConfig } from "redux-persist";
import type { ISessionState } from "@store/slices/sessionSlice";
import type { IFrameworkHealthState } from "@store/slices/frameworkHealthSlice";
import type { IAuthState } from "@store/slices/authSlice";
import type { IStudioContractsState } from "@store/slices/studioContractsSlice";

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

/** Fired on `window` when a Studio slice couldn't be written (storage full); the page tells the user. */
export const STUDIO_PERSIST_FAILED_EVENT = "studio:persist-failed";

/**
 * Studio's contract files can be large (an edited validations file is ~300 KB),
 * so a failed write is reported rather than silently lost.
 */
export const studioContractsPersistConfig: PersistConfig<IStudioContractsState> = {
    key: "studioContracts",
    storage,
    writeFailHandler: () => {
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent(STUDIO_PERSIST_FAILED_EVENT, { detail: "studioContracts" })
            );
        }
    },
};
