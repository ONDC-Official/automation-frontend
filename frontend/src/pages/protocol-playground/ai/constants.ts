// Canonical defaults live in the Redux slice (the settings' actual owner); re-exported here so
// existing feature imports (e.g. AISettingsPanel) don't need to reach into `@store` directly.
export { DEFAULT_AI_SETTINGS } from "@store/slices/aiSlice";
import { DEFAULT_AI_SETTINGS } from "@store/slices/aiSlice";

export const DEFAULT_AI_ENDPOINT = DEFAULT_AI_SETTINGS.endpoint;
export const DEFAULT_AI_MODEL = DEFAULT_AI_SETTINGS.model;

export const SNAPSHOT_TRUNCATION = {
    stepCodeMaxChars: 16_000,
    helperLibMaxChars: 8_000,
    terminalTailCount: 5,
    terminalLogMaxChars: 2_000,
};
