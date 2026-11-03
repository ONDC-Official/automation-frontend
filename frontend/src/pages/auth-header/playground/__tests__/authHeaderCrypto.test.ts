import { TextEncoder } from "util";
import {
    TEST_VECTOR,
    createAuthorizationHeader,
    generateDemoKeyPair,
    payloadWarnings,
    privateKeySeed,
    verifyAuthorizationHeader,
} from "../authHeaderCrypto";

// jsdom does not always expose TextEncoder
if (typeof globalThis.TextEncoder === "undefined") {
    (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}

const fromVector = () =>
    createAuthorizationHeader({
        payload: TEST_VECTOR.payload,
        privateKey: TEST_VECTOR.privateKey,
        subscriberId: TEST_VECTOR.subscriberId,
        uniqueKeyId: TEST_VECTOR.uniqueKeyId,
        created: TEST_VECTOR.created,
        ttl: TEST_VECTOR.ttl,
    });

describe("createAuthorizationHeader", () => {
    it("reproduces the published test vector", () => {
        const result = fromVector();
        expect(result.digestBase64).toBe(TEST_VECTOR.expectedDigest);
        expect(result.signatureBase64).toBe(TEST_VECTOR.expectedSignature);
        expect(result.publicKey).toBe(TEST_VECTOR.publicKey);
        expect(result.header).toBe(
            `Signature keyId="example-np.com|ukid-1|ed25519",algorithm="ed25519",created="1761638400",` +
                `expires="1761642000",headers="(created) (expires) digest",signature="${TEST_VECTOR.expectedSignature}"`
        );
    });

    it("accepts a 64-byte private key and signs identically", () => {
        const seed = Buffer.from(TEST_VECTOR.privateKey, "base64");
        const full = Buffer.concat([seed, Buffer.from(TEST_VECTOR.publicKey, "base64")]).toString(
            "base64"
        );
        const result = createAuthorizationHeader({
            payload: TEST_VECTOR.payload,
            privateKey: full,
            subscriberId: TEST_VECTOR.subscriberId,
            uniqueKeyId: TEST_VECTOR.uniqueKeyId,
            created: TEST_VECTOR.created,
            ttl: TEST_VECTOR.ttl,
        });
        expect(result.signatureBase64).toBe(TEST_VECTOR.expectedSignature);
    });

    it("rejects keys of the wrong length instead of signing", () => {
        const bad = Buffer.alloc(48, 1).toString("base64");
        expect(() => privateKeySeed(bad)).toThrow("must be 32 or 64 bytes");
    });
});

describe("verifyAuthorizationHeader", () => {
    const { header, created } = fromVector();

    it("accepts the test vector header", () => {
        const result = verifyAuthorizationHeader(
            header,
            TEST_VECTOR.payload,
            TEST_VECTOR.publicKey,
            created
        );
        expect(result.valid).toBe(true);
    });

    it("rejects a reformatted payload", () => {
        const pretty = JSON.stringify(JSON.parse(TEST_VECTOR.payload), null, 2);
        const result = verifyAuthorizationHeader(header, pretty, TEST_VECTOR.publicKey, created);
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/Signature does not match/);
    });

    it("rejects the wrong public key", () => {
        const result = verifyAuthorizationHeader(
            header,
            TEST_VECTOR.payload,
            generateDemoKeyPair().publicKey,
            created
        );
        expect(result.valid).toBe(false);
    });

    it("rejects an expired header", () => {
        const result = verifyAuthorizationHeader(
            header,
            TEST_VECTOR.payload,
            TEST_VECTOR.publicKey,
            created + 7200
        );
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/expired/);
    });
});

describe("payloadWarnings", () => {
    it("flags trailing newline, CRLF and BOM", () => {
        const ids = payloadWarnings("﻿{\r\n}\n").map((w) => w.id);
        expect(ids).toEqual(expect.arrayContaining(["bom", "crlf", "trailing-newline"]));
    });
});
