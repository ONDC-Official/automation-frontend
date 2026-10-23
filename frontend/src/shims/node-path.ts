/**
 * Browser stand-in for the slice of `node:path` that `json-schema-to-typescript-lite`
 * (Protocol Studio's spec → TypeScript types) uses to name types after a file:
 * POSIX `basename` / `extname` / `dirname` / `join`. Vite's empty stub has none.
 */
export const sep = "/";

export const basename = (path: string, ext?: string) => {
    const base = path.replace(/\/+$/, "").split("/").pop() ?? "";
    return ext && base.endsWith(ext) && base !== ext ? base.slice(0, -ext.length) : base;
};

export const extname = (path: string) => {
    const base = basename(path);
    const dot = base.lastIndexOf(".");
    return dot > 0 ? base.slice(dot) : "";
};

export const dirname = (path: string) => {
    const trimmed = path.replace(/\/+$/, "");
    const slash = trimmed.lastIndexOf("/");
    if (slash < 0) return ".";
    return slash === 0 ? "/" : trimmed.slice(0, slash);
};

export const join = (...parts: string[]) =>
    parts
        .filter(Boolean)
        .join("/")
        .replace(/\/{2,}/g, "/") || ".";

const path = { sep, basename, extname, dirname, join };
export const posix = path;
export default { ...path, posix };
