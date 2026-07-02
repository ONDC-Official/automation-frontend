import defaultLocalStorage from "redux-persist/lib/storage";
import defaultSessionStorage from "redux-persist/lib/storage/session";
import type { WebStorage } from "redux-persist";

/**
 * Vite/rolldown CJS→ESM interop can wrap redux-persist's default storage export in an extra
 * `{ default: ... }` layer, which makes `storage.getItem` undefined at runtime. Unwrap defensively
 * so the storage engine always exposes get/set/removeItem.
 */
const unwrap = (mod: unknown): WebStorage => {
    const candidate = mod as WebStorage & { default?: WebStorage };
    return candidate && typeof candidate.getItem === "function"
        ? candidate
        : (candidate.default as WebStorage);
};

export const storage = unwrap(defaultLocalStorage);
export const sessionStorage = unwrap(defaultSessionStorage);
