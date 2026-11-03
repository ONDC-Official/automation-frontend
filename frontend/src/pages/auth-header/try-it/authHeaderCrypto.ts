// ONDC authorization header creation and verification, run entirely in the browser.
// BLAKE2b-512 digest + Ed25519 signature, matching the reference code snippets.
import { blake2b } from "@noble/hashes/blake2b";
import { ed25519 } from "@noble/curves/ed25519";

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

export function toBase64(bytes: Uint8Array): string {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
    const binary = atob(value.trim());
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PayloadWarning {
    id: "trailing-newline" | "crlf" | "bom";
    message: string;
}

export function payloadWarnings(payload: string): PayloadWarning[] {
    const warnings: PayloadWarning[] = [];
    if (payload.startsWith("﻿")) {
        warnings.push({ id: "bom", message: "Payload starts with a UTF-8 BOM." });
    }
    if (payload.includes("\r\n")) {
        warnings.push({ id: "crlf", message: "Payload contains CRLF line endings." });
    }
    if (/\n$/.test(payload)) {
        warnings.push({ id: "trailing-newline", message: "Payload ends with a newline." });
    }
    return warnings;
}

export function digestPayload(payload: string): { hex: string; base64: string } {
    const hash = blake2b(utf8(payload), { dkLen: 64 });
    return { hex: toHex(hash), base64: toBase64(hash) };
}

export function buildSigningString(created: number, expires: number, digestBase64: string): string {
    return `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE2B-512=${digestBase64}`;
}

/** Accepts a Base64 Ed25519 private key as a 32-byte seed or 64-byte (seed + public key). */
export function privateKeySeed(privateKeyBase64: string): Uint8Array {
    let bytes: Uint8Array;
    try {
        bytes = fromBase64(privateKeyBase64);
    } catch {
        throw new Error("Private key is not valid Base64.");
    }
    if (bytes.length === 32) return bytes;
    if (bytes.length === 64) {
        const seed = bytes.slice(0, 32);
        const expectedPublic = toBase64(bytes.slice(32));
        if (toBase64(ed25519.getPublicKey(seed)) !== expectedPublic) {
            throw new Error(
                "64-byte private key is inconsistent: its last 32 bytes are not the matching public key."
            );
        }
        return seed;
    }
    throw new Error(`Private key must be 32 or 64 bytes; got ${bytes.length} bytes.`);
}

export function publicKeyFromPrivate(privateKeyBase64: string): string {
    return toBase64(ed25519.getPublicKey(privateKeySeed(privateKeyBase64)));
}

export function generateDemoKeyPair(): { privateKey: string; publicKey: string } {
    const seed = ed25519.utils.randomPrivateKey();
    return { privateKey: toBase64(seed), publicKey: toBase64(ed25519.getPublicKey(seed)) };
}

export interface CreateHeaderInput {
    payload: string;
    privateKey: string;
    subscriberId: string;
    uniqueKeyId: string;
    created: number;
    ttl: number;
}

export interface CreateHeaderResult {
    payloadBytes: number;
    digestHex: string;
    digestBase64: string;
    created: number;
    expires: number;
    signingString: string;
    signatureBase64: string;
    publicKey: string;
    header: string;
}

export function createAuthorizationHeader(input: CreateHeaderInput): CreateHeaderResult {
    const seed = privateKeySeed(input.privateKey);
    const expires = input.created + input.ttl;
    const digest = digestPayload(input.payload);
    const signingString = buildSigningString(input.created, expires, digest.base64);
    const signatureBase64 = toBase64(ed25519.sign(utf8(signingString), seed));
    const header =
        `Signature keyId="${input.subscriberId}|${input.uniqueKeyId}|ed25519",` +
        `algorithm="ed25519",created="${input.created}",expires="${expires}",` +
        `headers="(created) (expires) digest",signature="${signatureBase64}"`;
    return {
        payloadBytes: utf8(input.payload).length,
        digestHex: digest.hex,
        digestBase64: digest.base64,
        created: input.created,
        expires,
        signingString,
        signatureBase64,
        publicKey: toBase64(ed25519.getPublicKey(seed)),
        header,
    };
}

export function parseAuthorizationHeader(header: string): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const match of header.matchAll(/(\w+)="([^"]*)"/g)) fields[match[1]] = match[2];
    return fields;
}

export type VerifyStepStatus = "pass" | "fail" | "skip";

export interface VerifyStep {
    label: string;
    status: VerifyStepStatus;
    detail: string;
}

export interface VerifyResult {
    valid: boolean;
    reason: string;
    fields: Record<string, string>;
    digestBase64?: string;
    signingString?: string;
    steps: VerifyStep[];
}

export function verifyAuthorizationHeader(
    header: string,
    payload: string,
    publicKeyBase64: string,
    now: number
): VerifyResult {
    const steps: VerifyStep[] = [];
    const fail = (
        reason: string,
        fields: Record<string, string>,
        extra: Partial<VerifyResult> = {}
    ): VerifyResult => ({
        valid: false,
        reason,
        fields,
        steps,
        ...extra,
    });

    const fields = parseAuthorizationHeader(header);
    const missing = ["keyId", "algorithm", "created", "expires", "headers", "signature"].filter(
        (k) => !(k in fields)
    );
    if (missing.length > 0) {
        steps.push({
            label: "Parse header",
            status: "fail",
            detail: `Missing field(s): ${missing.join(", ")}`,
        });
        return fail(`Header is missing ${missing.join(", ")}.`, fields);
    }
    steps.push({ label: "Parse header", status: "pass", detail: `keyId="${fields.keyId}"` });

    if (fields.algorithm !== "ed25519") {
        steps.push({
            label: "Check algorithm",
            status: "fail",
            detail: `algorithm="${fields.algorithm}"`,
        });
        return fail(`Algorithm must be "ed25519", got "${fields.algorithm}".`, fields);
    }
    steps.push({ label: "Check algorithm", status: "pass", detail: 'algorithm="ed25519"' });

    const created = Number(fields.created);
    const expires = Number(fields.expires);
    if (!Number.isInteger(created) || !Number.isInteger(expires)) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: "created/expires are not integers",
        });
        return fail("created and expires must be Unix timestamps.", fields);
    }
    if (created > now) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: `created is ${created - now}s in the future`,
        });
        return fail("Header is not yet valid (created is in the future).", fields);
    }
    if (now > expires) {
        steps.push({
            label: "Check timestamps",
            status: "fail",
            detail: `expired ${now - expires}s ago`,
        });
        return fail("Header has expired.", fields);
    }
    steps.push({
        label: "Check timestamps",
        status: "pass",
        detail: `valid for another ${expires - now}s`,
    });

    const digestBase64 = digestPayload(payload).base64;
    steps.push({ label: "Hash payload (BLAKE2b-512)", status: "pass", detail: digestBase64 });

    const signingString = buildSigningString(created, expires, digestBase64);
    steps.push({ label: "Rebuild signing string", status: "pass", detail: signingString });

    let publicKey: Uint8Array;
    let signature: Uint8Array;
    try {
        publicKey = fromBase64(publicKeyBase64);
        signature = fromBase64(fields.signature);
    } catch {
        steps.push({
            label: "Verify signature (Ed25519)",
            status: "fail",
            detail: "invalid Base64",
        });
        return fail("Public key or signature is not valid Base64.", fields, {
            digestBase64,
            signingString,
        });
    }
    if (publicKey.length !== 32) {
        steps.push({
            label: "Verify signature (Ed25519)",
            status: "fail",
            detail: `public key is ${publicKey.length} bytes`,
        });
        return fail("Public key must be 32 bytes.", fields, { digestBase64, signingString });
    }

    let ok = false;
    try {
        ok = ed25519.verify(signature, utf8(signingString), publicKey);
    } catch {
        ok = false;
    }
    if (!ok) {
        steps.push({
            label: "Verify signature (Ed25519)",
            status: "fail",
            detail: "signature does not match",
        });
        return fail(
            "Signature does not match. Either the payload changed after signing (even whitespace or key order), or the public key does not belong to the signing key.",
            fields,
            { digestBase64, signingString }
        );
    }
    steps.push({ label: "Verify signature (Ed25519)", status: "pass", detail: "signature valid" });
    return { valid: true, reason: "", fields, digestBase64, signingString, steps };
}

/** Fixed demo values whose expected output was cross-checked with PyNaCl and libsodium. */
export const TEST_VECTOR = {
    privateKey: "+fk6yztZOHo6Q91URhs3lg8P20cHQxltukmY3PZm/Yk=",
    publicKey: "5395Go64SZY1pU2AZuVGrDsbAyvxSI1l+hsHiPJ4chg=",
    subscriberId: "example-np.com",
    uniqueKeyId: "ukid-1",
    payload:
        '{"context":{"domain":"ONDC:RET10","action":"search","bap_id":"example-np.com"},"message":{}}',
    created: 1761638400,
    ttl: 3600,
    expectedDigest:
        "Chk1f3RXlRGt6mlfUxTbSYm4k/AzKGfhx88wASRA4HOtRgsShMktmGaSpIwyR/AIY1LNCswSDw6UNV3mJjlCGg==",
    expectedSignature:
        "xOCaHVh0mTMK/wy1JyZ4t8SMwPkzf1KTEZm+58NJ1F5PkEgzQEv94yRoMBAMTB9LDS4Mp2KitpG0Zrym1VndCw==",
} as const;
