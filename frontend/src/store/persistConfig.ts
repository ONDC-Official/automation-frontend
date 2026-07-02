import { storage, sessionStorage } from "@store/storage";
import type { PersistConfig } from "redux-persist";
import type { IAuthState } from "@store/slices/authSlice";
import type { ISessionState } from "@store/slices/sessionSlice";
import type { IFrameworkHealthState } from "@store/slices/frameworkHealthSlice";

/** Persist only the auth token; user + loading flags stay ephemeral (refetched on boot). */
export const authPersistConfig: PersistConfig<IAuthState> = {
    key: "auth",
    storage,
    whitelist: ["token"],
};

/** Persist only the frontend-only UI prefs from the session slice. */
export const sessionPersistConfig: PersistConfig<ISessionState> = {
    key: "session",
    storage,
    whitelist: ["autoScrollEnabled", "experimentalMode"],
};

/** Framework-health admin auth flag lives in sessionStorage (per-tab), matching legacy behavior. */
export const frameworkHealthPersistConfig: PersistConfig<IFrameworkHealthState> = {
    key: "frameworkHealth",
    storage: sessionStorage,
};

/**
 * Slices persisted wholesale to localStorage. RTK Query API reducers and ephemeral slices
 * (devGuideShell server data, profileShell counts) are intentionally excluded.
 */
export const PERSISTED_SLICE_KEYS = [
    "theme",
    "sessionHistory",
    "supportSession",
    "uiFlags",
    "schemaValidation",
    "sellerLoadTest",
    "chatbot",
    "cooldowns",
    "ai",
] as const;
