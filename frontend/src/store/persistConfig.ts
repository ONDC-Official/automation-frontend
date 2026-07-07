import { storage, sessionStorage } from "@store/storage";
import type { PersistConfig } from "redux-persist";
import type { ISessionState } from "@store/slices/sessionSlice";
import type { IFrameworkHealthState } from "@store/slices/frameworkHealthSlice";
import type { IAuthState } from "@store/slices/authSlice";

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

/** Persist only the auth token — user profile is refetched on boot via `getMe`. */
export const authPersistConfig: PersistConfig<IAuthState> = {
    key: "auth",
    storage,
    whitelist: ["token"],
};
