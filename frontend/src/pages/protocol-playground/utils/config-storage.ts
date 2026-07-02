import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { store } from "@store/index";
import {
    upsertConfig,
    removeConfig,
    clearConfigs,
    type SavedConfig,
    type SavedConfigMetadata,
} from "@store/slices/playgroundConfigsSlice";

export type { SavedConfig, SavedConfigMetadata } from "@store/slices/playgroundConfigsSlice";

/**
 * Generate a unique config ID from domain, version, and flowId
 */
export function generateConfigId(
    domain: string,
    version: string,
    flowId: string,
    isGist?: boolean
): string {
    const baseId = `${domain}_${version}_${flowId}`.replace(/[^a-zA-Z0-9_]/g, "_");
    return isGist ? `gist_${baseId}` : baseId;
}

/**
 * Generate a unique config ID for gist-based configs using gist URL
 */
export function generateGistConfigId(gistUrl: string): string {
    // Extract gist ID from URL for consistent naming
    const gistId = extractGistId(gistUrl);
    return `gist_${gistId}`;
}

/**
 * Extract gist ID from various URL formats
 */
function extractGistId(input: string): string | null {
    if (!input || input.trim().length === 0) {
        return null;
    }

    const trimmed = input.trim();

    // If it's already just an ID (alphanumeric string)
    if (/^[a-f0-9]+$/i.test(trimmed)) {
        return trimmed;
    }

    // Extract from various Gist URL formats
    const patterns = [
        /gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i, // https://gist.github.com/username/id or https://gist.github.com/id
        /\/([a-f0-9]+)$/i, // Any URL ending with gist ID
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Save a config to localStorage with metadata
 */
export function saveConfig(
    domain: string,
    version: string,
    flowId: string,
    config: MockPlaygroundConfigType,
    isGist?: boolean
): boolean {
    try {
        const configId = generateConfigId(domain, version, flowId, isGist);
        const savedConfig: SavedConfig = {
            domain,
            version,
            flowId,
            configId,
            savedAt: new Date().toISOString(),
            // Clone: `config` is typically the caller's live, mutable working object
            // (e.g. Playground's `playgroundState`). Dispatching it as-is would let
            // Immer freeze that exact reference when the `configs` slice is produced,
            // silently freezing the caller's object too.
            config: structuredClone(config),
        };

        store.dispatch(upsertConfig(savedConfig));
        return true;
    } catch (error) {
        console.error("Failed to save config:", error);
        return false;
    }
}

/**
 * Save a gist-based config to localStorage
 */
export function saveGistConfig(gistUrl: string, config: MockPlaygroundConfigType): boolean {
    try {
        const gistId = extractGistId(gistUrl);
        if (!gistId) {
            console.error("Invalid gist URL");
            return false;
        }

        const configId = generateGistConfigId(gistUrl);
        const savedConfig: SavedConfig = {
            domain: config.meta.domain,
            version: config.meta.version,
            flowId: config.meta.flowId,
            configId,
            savedAt: new Date().toISOString(),
            // Clone for the same reason as saveConfig(): don't let Immer freeze the
            // caller's live object when it freezes the store's copy.
            config: structuredClone(config),
        };

        store.dispatch(upsertConfig(savedConfig));
        return true;
    } catch (error) {
        console.error("Failed to save gist config:", error);
        return false;
    }
}

/**
 * Load a specific config by ID
 */
export function loadConfig(configId: string): SavedConfig | null {
    try {
        return store.getState().playgroundConfigs.configs[configId] ?? null;
    } catch (error) {
        console.error("Failed to load config:", error);
        return null;
    }
}

/**
 * Load a config by domain, version, and flowId
 */
export function loadConfigByIdentifiers(
    domain: string,
    version: string,
    flowId: string
): SavedConfig | null {
    const configId = generateConfigId(domain, version, flowId);
    return loadConfig(configId);
}

/**
 * Get all saved configs metadata
 */
export function getSavedConfigsMetadata(): SavedConfigMetadata[] {
    try {
        return store.getState().playgroundConfigs.metadata;
    } catch (error) {
        console.error("Failed to load configs metadata:", error);
        return [];
    }
}

/**
 * Get all saved configs with their full data
 */
export function getAllSavedConfigs(): SavedConfig[] {
    const metadata = getSavedConfigsMetadata();
    const configs: SavedConfig[] = [];

    for (const meta of metadata) {
        const config = loadConfig(meta.configId);
        if (config) {
            configs.push(config);
        }
    }

    return configs;
}

/**
 * Delete a config by ID
 */
export function deleteConfig(configId: string): boolean {
    try {
        store.dispatch(removeConfig(configId));
        return true;
    } catch (error) {
        console.error("Failed to delete config:", error);
        return false;
    }
}

/**
 * Check if a config exists
 */
export function configExists(domain: string, version: string, flowId: string): boolean {
    const configId = generateConfigId(domain, version, flowId);
    return Boolean(store.getState().playgroundConfigs.configs[configId]);
}

/**
 * Clear all saved configs
 */
export function clearAllConfigs(): boolean {
    try {
        store.dispatch(clearConfigs());
        return true;
    } catch (error) {
        console.error("Failed to clear all configs:", error);
        return false;
    }
}
