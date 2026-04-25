import { LockedError, NotConfiguredError } from "./errors";
import { decryptGCM, encryptGCM, KDF_ITERATIONS } from "./crypto";
import { deleteRecord, getRecord, KEY_RECORD_ID, putRecord } from "./storage";
import { CURRENT_RECORD_VERSION, type StoredRecord } from "./types";

// Module-level closure holds the decrypted API key for the session. Never
// written back to storage in plaintext. A beforeunload listener wipes it on
// every page unload so reloads force a fresh unlock.
let decryptedKey: string | null = null;

type LockListener = () => void;
const lockListeners = new Set<LockListener>();

function wipeMemory(): void {
    decryptedKey = null;
    for (const listener of lockListeners) {
        try {
            listener();
        } catch {
            // Listeners must not break lock semantics.
        }
    }
}

let beforeUnloadBound = false;
function ensureUnloadBinding(): void {
    if (beforeUnloadBound || typeof window === "undefined") return;
    window.addEventListener("beforeunload", wipeMemory);
    beforeUnloadBound = true;
}

export async function setupKey(apiKey: string, passphrase: string): Promise<void> {
    if (!apiKey || apiKey.length === 0) {
        throw new Error("API key is empty");
    }
    if (!passphrase || passphrase.length === 0) {
        throw new Error("Passphrase is empty");
    }
    const encrypted = await encryptGCM(apiKey, passphrase);
    const now = Date.now();
    const record: StoredRecord = {
        id: KEY_RECORD_ID,
        version: CURRENT_RECORD_VERSION,
        kdf: { name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS },
        salt: encrypted.salt,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
        createdAt: now,
        updatedAt: now,
    };
    await putRecord(record);
    decryptedKey = apiKey;
    ensureUnloadBinding();
}

export async function unlockKey(passphrase: string): Promise<string> {
    const record = await getRecord();
    if (!record) {
        throw new NotConfiguredError();
    }
    // Uses the iterations from the stored record, not the current constant,
    // so older records keep working if iteration counts are raised later.
    const plaintext = await decryptGCM(
        { salt: record.salt, iv: record.iv, ciphertext: record.ciphertext },
        passphrase,
        record.kdf.iterations
    );
    decryptedKey = plaintext;
    ensureUnloadBinding();
    return plaintext;
}

export function getKey(): string {
    if (decryptedKey === null) {
        throw new LockedError();
    }
    return decryptedKey;
}

export function isUnlocked(): boolean {
    return decryptedKey !== null;
}

export async function isConfigured(): Promise<boolean> {
    const record = await getRecord();
    return record !== null;
}

export async function clearKey(): Promise<void> {
    wipeMemory();
    await deleteRecord();
}

export function lock(): void {
    wipeMemory();
}

export function onLock(cb: LockListener): () => void {
    lockListeners.add(cb);
    return () => {
        lockListeners.delete(cb);
    };
}

export {
    InvalidPassphraseError,
    LockedError,
    NotConfiguredError,
    StorageError,
} from "./errors";
