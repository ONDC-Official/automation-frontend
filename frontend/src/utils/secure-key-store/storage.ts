import { StorageError } from "./errors";
import type { StoredRecord } from "./types";

// IndexedDB is chosen over localStorage because:
//   - Binary data (ArrayBuffer) stores natively without base64 re-encoding overhead.
//   - Origin-scoped and async — no main-thread blocking on large reads.
//   - Lets us version the schema explicitly (onupgradeneeded) for future migrations.
const DB_NAME = "pg-ai-secure-store";
const DB_VERSION = 1;
const STORE_NAME = "keys";
export const KEY_RECORD_ID = "openai-api-key" as const;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(new StorageError(req.error?.message ?? "open failed"));
        req.onblocked = () => reject(new StorageError("IndexedDB open blocked"));
    });
}

export async function putRecord(record: StoredRecord): Promise<void> {
    const db = await openDB();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(new StorageError(req.error?.message ?? "put failed"));
        });
    } finally {
        db.close();
    }
}

export async function getRecord(): Promise<StoredRecord | null> {
    const db = await openDB();
    try {
        return await new Promise<StoredRecord | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(KEY_RECORD_ID);
            req.onsuccess = () => resolve((req.result as StoredRecord | undefined) ?? null);
            req.onerror = () => reject(new StorageError(req.error?.message ?? "get failed"));
        });
    } finally {
        db.close();
    }
}

export async function deleteRecord(): Promise<void> {
    const db = await openDB();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(KEY_RECORD_ID);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(new StorageError(req.error?.message ?? "delete failed"));
        });
    } finally {
        db.close();
    }
}
