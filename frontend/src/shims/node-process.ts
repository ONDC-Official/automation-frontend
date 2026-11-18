/**
 * Browser stand-in for `node:process`. Vite replaces Node built-ins with empty
 * stubs, but `json-schema-to-typescript-lite` (Protocol Studio's spec → TypeScript
 * types, via the mock-runner lib) reads `process.cwd()` when it loads, for a
 * default option that only matters for file `$ref`s, which Studio never follows.
 */
const process = {
    cwd: () => "/",
    env: {} as Record<string, string | undefined>,
    platform: "browser",
    browser: true,
};

export const { cwd, env, platform, browser } = process;
export default process;
