export const AI_SETTINGS_LS_KEY = "pg-ai-settings";

export const DEFAULT_AI_ENDPOINT = "https://api.openai.com";
export const DEFAULT_AI_MODEL = "gpt-4o-mini";

export const DEFAULT_AI_SETTINGS = {
    endpoint: DEFAULT_AI_ENDPOINT,
    model: DEFAULT_AI_MODEL,
    inlineCompletionEnabled: true,
    useProxy: false,
};

export const CONTEXT_TRUNCATION = {
    stepCodeMaxChars: 16_000,
    helperLibMaxChars: 8_000,
    terminalTailCount: 5,
    terminalLogMaxChars: 2_000,
};
