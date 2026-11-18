import { storage } from "@store/storage";

/** The async storage redux-persist reads and writes (`persistConfig.storage`). */
export interface AsyncStorage {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
}

export interface IdbStorageOptions {
    /** The IndexedDB factory; `globalThis.indexedDB` when omitted. Tests pass an in-memory one. */
    indexedDB?: IDBFactory | null;
    /**
     * Where everything goes when IndexedDB is missing or won't open, and where
     * keys written before IndexedDB are migrated from: localStorage by default.
     */
    fallback?: AsyncStorage;
    /** How long opening may take before the fallback is used for the session. */
    openTimeoutMs?: number;
    dbName?: string;
}

const STORE = "persist";
const OPEN_TIMEOUT_MS = 3000;

/** A transaction's one request, settled when the transaction is (written, or failed). */
const run = <T>(
    db: IDBDatabase,
    mode: IDBTransactionMode,
    request: (store: IDBObjectStore) => IDBRequest<T>
) =>
    new Promise<T>((resolve, reject) => {
        let tx: IDBTransaction;
        let req: IDBRequest<T>;
        try {
            tx = db.transaction(STORE, mode);
            req = request(tx.objectStore(STORE));
        } catch (error) {
            reject(error);
            return;
        }
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error ?? req.error ?? new Error("IndexedDB request failed"));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });

/**
 * A redux-persist storage on IndexedDB, with no dependency: room for large
 * persisted slices (Studio's contract files) that localStorage's ~5 MB,
 * shared by the whole app, can't hold.
 *
 * - **Falls back** to localStorage when IndexedDB is missing (jsdom, some
 *   private modes), can't open, or can't be read.
 * - **Always settles**: opening is capped (`openTimeoutMs`, 3 s); past it the
 *   fallback is used for the rest of the session. Once that happens nothing
 *   is written to IndexedDB, even if the open succeeds late, so a rehydrate
 *   that came up empty can't overwrite what is stored there.
 * - **Migrates** on read, once: when IndexedDB has nothing under a key that
 *   localStorage has (written before IndexedDB was used, or by a session that
 *   had to fall back), it is copied in, and removed from localStorage only
 *   once that write succeeded. When both have one, IndexedDB's is read and
 *   localStorage's is left where it is: a fallback session that rehydrated
 *   empty must not replace what IndexedDB holds.
 */
export const createIdbStorage = (options: IdbStorageOptions = {}): AsyncStorage => {
    const fallback = options.fallback ?? (storage as unknown as AsyncStorage);
    const openTimeoutMs = options.openTimeoutMs ?? OPEN_TIMEOUT_MS;
    const dbName = options.dbName ?? "redux-persist";

    let opening: Promise<IDBDatabase | null> | null = null;
    /** Set once IndexedDB failed this session: everything goes to the fallback from then on. */
    let failed = false;

    const open = () =>
        (opening ??= new Promise<IDBDatabase | null>((resolve) => {
            const factory =
                options.indexedDB !== undefined
                    ? options.indexedDB
                    : typeof indexedDB !== "undefined"
                      ? indexedDB
                      : null;
            if (!factory) {
                resolve(null);
                return;
            }
            let settled = false;
            const finish = (db: IDBDatabase | null) => {
                if (settled) {
                    // Opened after the cap: the session already uses the fallback.
                    db?.close();
                    return;
                }
                settled = true;
                clearTimeout(timer);
                resolve(db);
            };
            const timer = setTimeout(() => finish(null), openTimeoutMs);
            try {
                const request = factory.open(dbName, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
                };
                request.onsuccess = () => finish(request.result);
                request.onerror = () => finish(null);
            } catch {
                finish(null);
            }
        }).then((db) => {
            if (!db) failed = true;
            return db;
        }));

    /** The open database, or null when this session uses the fallback. */
    const database = async () => (failed ? null : open());

    return {
        getItem: async (key) => {
            const db = await database();
            if (!db) return fallback.getItem(key);
            let stored: string | null;
            try {
                stored =
                    ((await run(db, "readonly", (s) => s.get(key))) as string | undefined) ?? null;
            } catch {
                // Unreadable: the session falls back rather than rehydrate empty over the data.
                failed = true;
                return fallback.getItem(key);
            }
            const legacy = await fallback.getItem(key).catch(() => null);
            if (legacy === null) return stored;
            if (stored !== null && stored !== legacy) return stored;
            // IndexedDB is empty here: copy localStorage's in, and only drop it
            // from localStorage once IndexedDB holds it (the same text in both
            // means an earlier move got that far).
            if (stored === null) {
                try {
                    await run(db, "readwrite", (s) => s.put(legacy, key));
                } catch {
                    return legacy;
                }
            }
            try {
                await fallback.removeItem(key);
            } catch {
                // Left behind: the next read finds the same text in both and drops it then.
            }
            return legacy;
        },
        setItem: async (key, value) => {
            const db = await database();
            if (!db) return fallback.setItem(key, value);
            // A failed write rejects, so redux-persist's writeFailHandler reports it.
            await run(db, "readwrite", (s) => s.put(value, key));
        },
        removeItem: async (key) => {
            const db = await database();
            if (db) await run(db, "readwrite", (s) => s.delete(key));
            await fallback.removeItem(key);
        },
    };
};

/** IndexedDB-backed storage for the persisted slices too large for localStorage. */
export const idbStorage = createIdbStorage();
