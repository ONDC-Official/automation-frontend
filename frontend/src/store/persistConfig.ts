import { storage, sessionStorage } from "@store/storage";
import type { PersistConfig } from "redux-persist";
import type { IAuthState } from "@store/slices/authSlice";
import type { ISessionState } from "@store/slices/sessionSlice";
import type { IFrameworkHealthState } from "@store/slices/frameworkHealthSlice";

/** Persist the auth token. `user`/`isAuthLoading` aren't store state at all — see authContext.ts. */
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
