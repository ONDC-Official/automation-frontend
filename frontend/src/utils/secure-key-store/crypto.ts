import { InvalidPassphraseError } from "./errors";
import type { EncryptedPayload } from "./types";

// OWASP 2023 recommendation for PBKDF2-SHA256: raises the cost of GPU dictionary
// attacks against an exfiltrated DB dump. At ~300–500ms/try on a mid-tier laptop,
// this is a deliberate tradeoff between UX (one-time unlock pause) and brute-force
// resistance.
export const KDF_ITERATIONS = 600_000;

// SHA-256 is widely supported across WebCrypto implementations. SHA-512 would
// require more memory per iteration without meaningfully raising attacker cost
// at this iteration count.
const KDF_HASH = "SHA-256" as const;

// 128-bit random salt per setup defeats rainbow-table attacks and guarantees
// that identical passphrases produce distinct derived keys across installs.
export const SALT_LENGTH = 16;

// AES-GCM's recommended IV length. A fresh random IV per encryption is critical
// — reusing an IV with the same key catastrophically breaks GCM's confidentiality
// and integrity guarantees.
export const IV_LENGTH = 12;

// AES-256 provides ample margin over the ~entropy-limited keys derived from
// human-chosen passphrases; the bottleneck is the passphrase, not the cipher.
const KEY_LENGTH_BITS = 256;

async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const enc = new TextEncoder();
    // Import the raw passphrase bytes as a non-extractable base key usable only
    // for KDF derivation. This also guarantees the passphrase itself cannot be
    // re-exported from WebCrypto.
    const baseKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // `extractable: false` is the critical bit here: once derived, the AES key
    // cannot be read out of WebCrypto — it can only be used via encrypt/decrypt.
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: KDF_HASH },
        baseKey,
        { name: "AES-GCM", length: KEY_LENGTH_BITS },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptGCM(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(passphrase, salt.buffer as ArrayBuffer);
    // AES-GCM is AEAD: the returned ciphertext embeds a 128-bit auth tag.
    // Any tampering or wrong-key decryption fails the tag and raises OperationError.
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(plaintext)
    );
    return {
        salt: salt.buffer as ArrayBuffer,
        iv: iv.buffer as ArrayBuffer,
        ciphertext,
    };
}

export async function decryptGCM(
    payload: EncryptedPayload,
    passphrase: string,
    iterations: number
): Promise<string> {
    // Use the iterations from the stored record so old records remain decryptable
    // if we ever increase KDF_ITERATIONS for new setups.
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: payload.salt, iterations, hash: KDF_HASH },
        baseKey,
        { name: "AES-GCM", length: KEY_LENGTH_BITS },
        false,
        ["encrypt", "decrypt"]
    );
    try {
        const pt = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: payload.iv },
            key,
            payload.ciphertext
        );
        return new TextDecoder().decode(pt);
    } catch {
        // AES-GCM throws DOMException/OperationError when the auth tag fails —
        // which is exactly and only what a wrong passphrase produces (assuming
        // the ciphertext itself isn't corrupt). We re-raise as a distinct typed
        // error so callers can surface a clean "invalid passphrase" message
        // instead of a generic crash.
        throw new InvalidPassphraseError();
    }
}
