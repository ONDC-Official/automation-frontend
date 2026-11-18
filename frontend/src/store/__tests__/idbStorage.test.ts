import { createIdbStorage, type AsyncStorage } from "@store/idbStorage";
import { storage as localStore } from "@store/storage";

/** How the fake database's open behaves. */
type OpenMode = "ok" | "error" | "hang" | "late";

/**
 * An in-memory IndexedDB: just what idbStorage uses (open with an upgrade, one
 * object store, get / put / delete in a transaction), settling asynchronously
 * like the real one. `state` says what reached it.
 */
const fakeIndexedDB = ({
    open = "ok" as OpenMode,
    failWrites = false,
    data = new Map<string, string>(),
} = {}) => {
    const state = { data, transactions: 0, closed: false };
    const stores = new Set<string>();
    const later = (fn: () => void, ms = 0) => setTimeout(fn, ms);
    const db = {
        objectStoreNames: { contains: (name: string) => stores.has(name) },
        createObjectStore: (name: string) => stores.add(name),
        close: () => {
            state.closed = true;
        },
        transaction: () => {
            state.transactions += 1;
            const tx: Record<string, unknown> & {
                oncomplete?: () => void;
                onerror?: () => void;
                error?: Error;
            } = {};
            const request: { result?: unknown } = {};
            const done = () => tx.oncomplete?.();
            tx.objectStore = () => ({
                get: (key: string) => {
                    later(() => {
                        request.result = state.data.get(key);
                        done();
                    });
                    return request;
                },
                put: (value: string, key: string) => {
                    later(() => {
                        if (failWrites) {
                            tx.error = new Error("QuotaExceededError");
                            tx.onerror?.();
                            return;
                        }
                        state.data.set(key, value);
                        done();
                    });
                    return request;
                },
                delete: (key: string) => {
                    later(() => {
                        state.data.delete(key);
                        done();
                    });
                    return request;
                },
            });
            return tx;
        },
    };
    const factory = {
        open: () => {
            const request: {
                result?: unknown;
                onupgradeneeded?: () => void;
                onsuccess?: () => void;
                onerror?: () => void;
            } = {};
            const succeed = () => {
                request.result = db;
                request.onupgradeneeded?.();
                request.onsuccess?.();
            };
            if (open === "ok") later(succeed);
            else if (open === "late") later(succeed, 60);
            else if (open === "error") later(() => request.onerror?.());
            return request;
        },
    };
    return { factory: factory as unknown as IDBFactory, state };
};

/** localStorage as redux-persist sees it, in memory. */
const memoryStorage = (initial: Record<string, string> = {}) => {
    const items = new Map(Object.entries(initial));
    const storage: AsyncStorage & { items: Map<string, string> } = {
        items,
        getItem: jest.fn(async (key: string) => items.get(key) ?? null),
        setItem: jest.fn(async (key: string, value: string) => {
            items.set(key, value);
        }),
        removeItem: jest.fn(async (key: string) => {
            items.delete(key);
        }),
    };
    return storage;
};

const KEY = "persist:studioContracts";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("idbStorage", () => {
    it("keeps values in IndexedDB, not localStorage", async () => {
        const { factory, state } = fakeIndexedDB();
        const fallback = memoryStorage();
        const storage = createIdbStorage({ indexedDB: factory, fallback });
        await storage.setItem(KEY, '{"a":1}');
        expect(state.data.get(KEY)).toBe('{"a":1}');
        expect(await storage.getItem(KEY)).toBe('{"a":1}');
        expect(fallback.setItem).not.toHaveBeenCalled();
        await storage.removeItem(KEY);
        expect(state.data.has(KEY)).toBe(false);
    });

    it("copies a localStorage key in, then deletes it from localStorage", async () => {
        const { factory, state } = fakeIndexedDB();
        const fallback = memoryStorage({ [KEY]: '{"old":true}' });
        const storage = createIdbStorage({ indexedDB: factory, fallback });
        expect(await storage.getItem(KEY)).toBe('{"old":true}');
        expect(state.data.get(KEY)).toBe('{"old":true}');
        expect(fallback.items.has(KEY)).toBe(false);
        // Once moved, it is read from IndexedDB.
        expect(await storage.getItem(KEY)).toBe('{"old":true}');
    });

    it("leaves a localStorage copy alone when IndexedDB already holds one", async () => {
        const { factory, state } = fakeIndexedDB({ data: new Map([[KEY, '{"idb":1}']]) });
        const fallback = memoryStorage({ [KEY]: "{}" });
        const storage = createIdbStorage({ indexedDB: factory, fallback });
        expect(await storage.getItem(KEY)).toBe('{"idb":1}');
        expect(state.data.get(KEY)).toBe('{"idb":1}');
        expect(fallback.items.get(KEY)).toBe("{}");
        expect(fallback.removeItem).not.toHaveBeenCalled();
    });

    it("keeps the localStorage key when IndexedDB can't take the copy", async () => {
        const { factory, state } = fakeIndexedDB({ failWrites: true });
        const fallback = memoryStorage({ [KEY]: '{"old":true}' });
        const storage = createIdbStorage({ indexedDB: factory, fallback });
        expect(await storage.getItem(KEY)).toBe('{"old":true}');
        expect(state.data.has(KEY)).toBe(false);
        expect(fallback.items.get(KEY)).toBe('{"old":true}');
        // A failed write rejects, so redux-persist reports it.
        await expect(storage.setItem(KEY, "{}")).rejects.toThrow("QuotaExceededError");
    });

    it("uses localStorage when there is no IndexedDB (jsdom)", async () => {
        const storage = createIdbStorage({ indexedDB: null });
        await storage.setItem("persist:idb-test", '{"x":1}');
        // Straight through to localStorage (redux-persist's wrapper of it).
        expect(await localStore.getItem("persist:idb-test")).toBe('{"x":1}');
        expect(await storage.getItem("persist:idb-test")).toBe('{"x":1}');
        await storage.removeItem("persist:idb-test");
        expect(await localStore.getItem("persist:idb-test")).toBeNull();
    });

    it("falls back when IndexedDB won't open, and never writes to it", async () => {
        const { factory, state } = fakeIndexedDB({ open: "error" });
        const fallback = memoryStorage({ [KEY]: '{"kept":1}' });
        const storage = createIdbStorage({ indexedDB: factory, fallback });
        expect(await storage.getItem(KEY)).toBe('{"kept":1}');
        await storage.setItem(KEY, '{"kept":2}');
        expect(fallback.items.get(KEY)).toBe('{"kept":2}');
        expect(state.transactions).toBe(0);
    });

    it("settles when opening hangs, and stays on the fallback", async () => {
        const { factory, state } = fakeIndexedDB({ open: "hang" });
        const fallback = memoryStorage({ [KEY]: '{"kept":1}' });
        const storage = createIdbStorage({ indexedDB: factory, fallback, openTimeoutMs: 20 });
        expect(await storage.getItem(KEY)).toBe('{"kept":1}');
        await storage.setItem(KEY, '{"kept":2}');
        expect(fallback.items.get(KEY)).toBe('{"kept":2}');
        expect(state.transactions).toBe(0);
    });

    it("ignores an open that succeeds after the cap: nothing is written to IndexedDB", async () => {
        const { factory, state } = fakeIndexedDB({
            open: "late",
            data: new Map([[KEY, '{"stored":1}']]),
        });
        const fallback = memoryStorage();
        const storage = createIdbStorage({ indexedDB: factory, fallback, openTimeoutMs: 20 });
        // The rehydrate came up empty (the fallback has nothing)…
        expect(await storage.getItem(KEY)).toBeNull();
        await wait(80);
        // …and what it writes doesn't overwrite what IndexedDB holds.
        await storage.setItem(KEY, "{}");
        expect(state.data.get(KEY)).toBe('{"stored":1}');
        expect(state.transactions).toBe(0);
        expect(state.closed).toBe(true);
        expect(fallback.items.get(KEY)).toBe("{}");
    });
});
