/**
 * Centralized localStorage management class
 * Provides type-safe access to localStorage with JSON serialization/deserialization
 */
class LocalStorageManager {
    private static instance: LocalStorageManager;

    /**
     * Get singleton instance
     */
    static getInstance(): LocalStorageManager {
        if (!LocalStorageManager.instance) {
            LocalStorageManager.instance = new LocalStorageManager();
        }
        return LocalStorageManager.instance;
    }

    /**
     * Generic method to get item from localStorage
     * @param key - The localStorage key
     * @returns The parsed value or null if not found/invalid
     */
    getItem<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return null;
            }
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error parsing localStorage item "${key}":`, error);
            // Remove invalid item
            this.removeItem(key);
            return null;
        }
    }

    /**
     * Generic method to set item in localStorage
     * @param key - The localStorage key
     * @param value - The value to store (will be JSON stringified)
     */
    setItem<T>(key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage item "${key}":`, error);
        }
    }

    /**
     * Generic method to remove item from localStorage
     * @param key - The localStorage key
     */
    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage item "${key}":`, error);
        }
    }

    /**
     * Check if an item exists in localStorage
     * @param key - The localStorage key
     * @returns true if item exists and is valid, false otherwise
     */
    hasItem(key: string): boolean {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return false;
            }
            JSON.parse(item);
            return true;
        } catch (error) {
            console.error(`Error checking if item exists in localStorage "${key}":`, error);
            return false;
        }
    }

    /**
     * Validate and clean up an item if it's invalid
     * @param key - The localStorage key
     * @returns true if item is valid, false if it was removed
     */
    validateAndCleanup(key: string): boolean {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return false;
            }
            JSON.parse(item);
            return true;
        } catch (error) {
            console.error(`Error validating and cleaning up item "${key}":`, error);
            this.removeItem(key);
            return false;
        }
    }
}

/**
 * Session ID Support Storage Interface
 */
export interface SessionIdForSupport {
    unitSession?: string;
    scenarioSession?: string;
}

/**
 * Specialized class for managing sessionIdForSupport
 */
class SessionIdSupportManager {
    private static readonly KEY = "sessionIdForSupport";
    private storage: LocalStorageManager;

    constructor() {
        this.storage = LocalStorageManager.getInstance();
    }

    /**
     * Get the sessionIdForSupport object
     * @returns SessionIdForSupport object or null if not found/invalid
     */
    get(): SessionIdForSupport | null {
        return this.storage.getItem<SessionIdForSupport>(SessionIdSupportManager.KEY);
    }

    /**
     * Set the sessionIdForSupport object
     * @param value - The SessionIdForSupport object to store
     */
    set(value: SessionIdForSupport): void {
        this.storage.setItem<SessionIdForSupport>(SessionIdSupportManager.KEY, value);
    }

    /**
     * Update the sessionIdForSupport object (merges with existing data)
     * @param updates - Partial SessionIdForSupport object to merge
     */
    update(updates: Partial<SessionIdForSupport>): void {
        const existing = this.get() || {};
        this.set({ ...existing, ...updates });
    }

    /**
     * Set unit session ID
     * @param unitSession - The unit session ID
     */
    setUnitSession(unitSession: string): void {
        this.update({ unitSession });
    }

    /**
     * Set scenario session ID
     * @param scenarioSession - The scenario session ID
     */
    setScenarioSession(scenarioSession: string): void {
        this.update({ scenarioSession });
    }

    /**
     * Remove the sessionIdForSupport from localStorage
     */
    remove(): void {
        this.storage.removeItem(SessionIdSupportManager.KEY);
    }

    /**
     * Check if sessionIdForSupport exists and is valid
     * @returns true if exists and valid, false otherwise
     */
    exists(): boolean {
        return this.storage.hasItem(SessionIdSupportManager.KEY);
    }

    /**
     * Validate and clean up sessionIdForSupport if invalid
     * @returns true if valid, false if it was removed
     */
    validateAndCleanup(): boolean {
        return this.storage.validateAndCleanup(SessionIdSupportManager.KEY);
    }
}

// Export singleton instances
export const localStorageManager = LocalStorageManager.getInstance();
export const sessionIdSupport = new SessionIdSupportManager();
