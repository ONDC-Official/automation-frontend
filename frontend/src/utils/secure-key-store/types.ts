export const CURRENT_RECORD_VERSION = 1;

export interface KdfParams {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
}

export interface StoredRecord {
    id: "openai-api-key";
    version: typeof CURRENT_RECORD_VERSION;
    kdf: KdfParams;
    salt: ArrayBuffer;
    iv: ArrayBuffer;
    ciphertext: ArrayBuffer;
    createdAt: number;
    updatedAt: number;
}

export type EncryptedPayload = {
    salt: ArrayBuffer;
    iv: ArrayBuffer;
    ciphertext: ArrayBuffer;
};
