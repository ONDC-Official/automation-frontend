import type { AppStore, RootState } from "@store/index";
import { setToken } from "@store/slices/authSlice";
import { setAutoScrollEnabled, setExperimentalMode } from "@store/slices/sessionSlice";
import { setSessions, type IFlowTestingSessionEntry } from "@store/slices/sessionHistorySlice";
import { setSupportSession } from "@store/slices/supportSessionSlice";
import { setSellerSession, type ISellerSessionData } from "@store/slices/sellerLoadTestSlice";
import { setDraftPayload } from "@store/slices/schemaValidationSlice";
import { setMcpSessionId } from "@store/slices/chatbotSlice";
import { setAiSettings, DEFAULT_AI_SETTINGS, type AiSettings } from "@store/slices/aiSlice";
import { setFrameworkHealthAuthenticated } from "@store/slices/frameworkHealthSlice";
import {
    importConfigs,
    setDraftConfig,
    type SavedConfig,
} from "@store/slices/playgroundConfigsSlice";
import type { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";

const MIGRATION_FLAG = "redux-legacy-migrated-v1";

function readJson<T>(raw: string | null): T | null {
    if (raw === null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/**
 * One-time import of pre-Redux localStorage/sessionStorage keys into the store, run after
 * redux-persist has rehydrated (via PersistGate onBeforeLift). Legacy keys are removed after import
 * so the store becomes the single source of truth. Keys still needed for backward compatibility
 * (auth token via redux-persist `auth` slice; sessionIdForSupport) are re-populated by listener
 */
export function runLegacyStorageMigration(store: AppStore): void {
    try {
        if (localStorage.getItem(MIGRATION_FLAG) === "true") return;
    } catch {
        return;
    }

    const { dispatch } = store;
    const state = store.getState() as RootState;

    // Legacy standalone authToken key → auth slice (redux-persist owns token going forward).
    const legacyToken = readJson<string>(localStorage.getItem("authToken"));
    if (legacyToken && !state.auth.token) {
        dispatch(setToken(legacyToken));
    }
    if (legacyToken !== null) {
        try {
            localStorage.removeItem("authToken");
        } catch {
            /* ignore */
        }
    }

    // Support session (kept in localStorage via listener write-through; not removed here).
    const legacySupport = readJson<{ unitSession?: string; scenarioSession?: string }>(
        localStorage.getItem("sessionIdForSupport")
    );
    if (legacySupport) {
        dispatch(setSupportSession(legacySupport));
    }

    // Session UI prefs.
    const autoScroll = localStorage.getItem("flow-auto-scroll-enabled");
    if (autoScroll !== null) {
        dispatch(setAutoScrollEnabled(autoScroll !== "false"));
        localStorage.removeItem("flow-auto-scroll-enabled");
    }
    const experimental = localStorage.getItem("flow-experimental-mode");
    if (experimental !== null) {
        dispatch(setExperimentalMode(experimental === "true"));
        localStorage.removeItem("flow-experimental-mode");
    }

    // Flow-testing session history.
    const sessions = readJson<IFlowTestingSessionEntry[]>(
        localStorage.getItem("flowTestingSessions")
    );
    if (Array.isArray(sessions) && sessions.length > 0) {
        dispatch(setSessions(sessions));
        localStorage.removeItem("flowTestingSessions");
    }

    // Seller load-test session.
    const sellerSession = readJson<ISellerSessionData>(localStorage.getItem("seller_session"));
    if (sellerSession) {
        dispatch(setSellerSession(sellerSession));
        localStorage.removeItem("seller_session");
    }

    // Schema validation draft payload (stored raw, not JSON).
    const schemaPayload = localStorage.getItem("schema-validation-payload");
    if (schemaPayload !== null) {
        dispatch(setDraftPayload(schemaPayload));
        localStorage.removeItem("schema-validation-payload");
    }

    // Chatbot MCP session id (stored raw string).
    const mcpSessionId = localStorage.getItem("mcp_session_id");
    if (mcpSessionId) {
        dispatch(setMcpSessionId(mcpSessionId));
        localStorage.removeItem("mcp_session_id");
    }

    // AI settings.
    const aiSettings = readJson<Partial<AiSettings>>(localStorage.getItem("pg-ai-settings"));
    if (aiSettings) {
        dispatch(setAiSettings({ ...DEFAULT_AI_SETTINGS, ...aiSettings }));
        localStorage.removeItem("pg-ai-settings");
    }

    // Playground saved configs + draft.
    const playgroundMetadata = readJson<{ configId: string }[]>(
        localStorage.getItem("playground_configs_metadata")
    );
    if (Array.isArray(playgroundMetadata) && playgroundMetadata.length > 0) {
        const configs: SavedConfig[] = [];
        for (const meta of playgroundMetadata) {
            const saved = readJson<SavedConfig>(
                localStorage.getItem(`playground_config_${meta.configId}`)
            );
            if (saved) {
                configs.push(saved);
                localStorage.removeItem(`playground_config_${meta.configId}`);
            }
        }
        if (configs.length > 0) {
            dispatch(importConfigs(configs));
        }
        localStorage.removeItem("playground_configs_metadata");
    }
    const playgroundDraft = readJson<MockPlaygroundConfigType>(
        localStorage.getItem("playgroundConfig")
    );
    if (playgroundDraft) {
        dispatch(setDraftConfig(playgroundDraft));
        localStorage.removeItem("playgroundConfig");
    }

    // Framework-health admin auth (sessionStorage).
    try {
        if (sessionStorage.getItem("framework_health_auth") === "true") {
            dispatch(setFrameworkHealthAuthenticated(true));
            sessionStorage.removeItem("framework_health_auth");
        }
    } catch {
        /* ignore sessionStorage access errors */
    }

    try {
        localStorage.setItem(MIGRATION_FLAG, "true");
    } catch {
        /* ignore */
    }
}
