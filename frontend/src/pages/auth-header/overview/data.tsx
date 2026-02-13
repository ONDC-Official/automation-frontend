import { FaHashtag, FaKey } from "react-icons/fa";
import { FlowStep, AlgorithmInfo, ScenarioRow } from "@pages/auth-header/overview/types";

export const signingFlowSteps: FlowStep[] = [
    { label: "JSON Payload", bgColor: "bg-sky-100", textColor: "text-sky-800" },
    { label: "BLAKE2b-512 Hash", bgColor: "bg-amber-100", textColor: "text-amber-800" },
    { label: "Create Signing String", bgColor: "bg-green-100", textColor: "text-green-800" },
    { label: "Ed25519 Sign", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    { label: "Base64 Encode", bgColor: "bg-rose-100", textColor: "text-rose-800" },
    { label: "Auth Header", bgColor: "bg-indigo-100", textColor: "text-indigo-800" },
];

export const verificationFlowSteps: FlowStep[] = [
    { label: "Auth Header", bgColor: "bg-indigo-100", textColor: "text-indigo-800" },
    { label: "Parse Header", bgColor: "bg-orange-100", textColor: "text-orange-800" },
    { label: "Hash Payload", bgColor: "bg-amber-100", textColor: "text-amber-800" },
    { label: "Reconstruct Signing String", bgColor: "bg-green-100", textColor: "text-green-800" },
    { label: "Ed25519 Verify", bgColor: "bg-purple-100", textColor: "text-purple-800" },
    { label: "✓ Valid / ✗ Invalid", bgColor: "bg-emerald-100", textColor: "text-emerald-800" },
];

export const algorithmCards: AlgorithmInfo[] = [
    {
        title: "BLAKE2b-512 Hashing",
        description:
            "BLAKE2b is a cryptographic hash function faster than MD5 and SHA-1, while providing security comparable to SHA-3.",
        icon: <FaHashtag className="text-xl" />,
        iconBgColor: "bg-amber-100",
        iconTextColor: "text-amber-600",
        details: [
            { label: "Output size", value: "512 bits (64 bytes)" },
            { label: "Purpose", value: "Creates a fixed-size digest of the payload" },
            {
                label: "Property",
                value: "Any change to payload produces completely different hash",
            },
        ],
        codeExample: "digest = BLAKE2b-512(payload) → 64 bytes → Base64 encoded",
    },
    {
        title: "Ed25519 Signatures",
        description:
            "Ed25519 is an elliptic curve digital signature algorithm using Curve25519. It provides high security with small key sizes.",
        icon: <FaKey className="text-xl" />,
        iconBgColor: "bg-purple-100",
        iconTextColor: "text-purple-600",
        details: [
            { label: "Private key", value: "32 bytes (seed) or 64 bytes (expanded)" },
            { label: "Public key", value: "32 bytes" },
            { label: "Signature", value: "64 bytes" },
            { label: "Security", value: "~128-bit security level" },
        ],
        codeExample: "signature = Ed25519.sign(private_key, signing_string)",
    },
];

export const AI_PROMPT = `Generate two functions for ONDC authorization header creation and verification in [YOUR_LANGUAGE/FRAMEWORK].

## Requirements:

### Function 1: create_authorisation_header
**Inputs:**
- payload: Raw JSON string (not parsed object) - must preserve exact formatting
- private_key: Base64-encoded Ed25519 private key (32 or 64 bytes)
- subscriber_id: String identifier for the subscriber
- unique_key_id: String identifier for the key

**Process:**
1. Get current Unix timestamp
2. Set TTL to 3600 seconds (1 hour)
3. Hash the EXACT payload string using BLAKE2b-512 (64 bytes output)
4. Base64 encode the hash to create digest
5. Create signing string in this EXACT format:
   "(created): {timestamp}\\n(expires): {timestamp + ttl}\\ndigest: BLAKE-512={digest}"
6. Sign the signing string using Ed25519 with the private key
7. Base64 encode the signature
8. Return authorization header in this format:
   Signature keyId="{subscriber_id}|{unique_key_id}|ed25519",algorithm="ed25519",created="{timestamp}",expires="{timestamp + ttl}",headers="(created) (expires) digest",signature="{signature}"

### Function 2: verify_authorisation_header
**Inputs:**
- auth_header: The authorization header string to verify
- payload: Raw JSON string (must match exactly what was signed)
- public_key: Base64-encoded Ed25519 public key (32 bytes)

**Process:**
1. Parse the auth header to extract: created, expires, signature
2. Validate timestamps (created <= now <= expires)
3. Hash the EXACT payload string using BLAKE2b-512
4. Base64 encode the hash
5. Reconstruct the signing string using extracted timestamps
6. Decode the signature from Base64
7. Verify signature using Ed25519 with the public key
8. Return boolean (valid/invalid) and error message if invalid

## Critical Requirements:
- Use BLAKE2b with 512-bit (64 bytes) output, NOT BLAKE2s
- Use Ed25519 for signing/verification (NOT ECDSA or RSA)
- Preserve exact payload string - do NOT parse and re-stringify JSON
- Private key may be 32 bytes (seed) or 64 bytes (expanded) - handle both
- All cryptographic values should be Base64 encoded (standard, not URL-safe)
- Include proper error handling and logging

## Libraries to use:
- Python: PyNaCl (nacl)
- Node.js: libsodium-wrappers
- Go: golang.org/x/crypto/blake2b, crypto/ed25519
- Java: BouncyCastle
- PHP: sodium extension
- Rust: ed25519-dalek, blake2
- C#: BouncyCastle.Cryptography

Please provide complete, production-ready code with error handling.`;

export const SIGNING_STRING_FORMAT = `(created): {unix_timestamp}
(expires): {unix_timestamp + ttl}
digest: BLAKE-512={base64_hash}`;

export const AUTH_HEADER_FORMAT = `Signature keyId="{subscriber_id}|{unique_key_id}|ed25519",
algorithm="ed25519",
created="{timestamp}",
expires="{timestamp + ttl}",
headers="(created) (expires) digest",
signature="{base64_signature}"`;

export const payloadFormatScenarios: ScenarioRow[] = [
    {
        signingPayload: "Minified JSON",
        verificationPayload: "Same Minified JSON",
        result: "✓ Valid",
        reason: "Exact byte match",
    },
    {
        signingPayload: "Formatted JSON",
        verificationPayload: "Same Formatted JSON",
        result: "✓ Valid",
        reason: "Exact byte match",
    },
    {
        signingPayload: "Minified JSON",
        verificationPayload: "Formatted JSON",
        result: "✗ Invalid",
        reason: "Different bytes = different hash",
    },
    {
        signingPayload: "Formatted JSON",
        verificationPayload: "Minified JSON",
        result: "✗ Invalid",
        reason: "Different bytes = different hash",
    },
    {
        signingPayload: "JSON with spaces",
        verificationPayload: "JSON with tabs",
        result: "✗ Invalid",
        reason: "Whitespace affects hash",
    },
    {
        signingPayload: "Original JSON",
        verificationPayload: "Re-serialized JSON",
        result: "✗ Invalid",
        reason: "Parsing + stringify changes format",
    },
];

export const keyScenarios: ScenarioRow[] = [
    {
        signingKey: "Private Key A",
        verificationKey: "Public Key A (matching)",
        result: "✓ Valid",
        reason: "Correct key pair",
    },
    {
        signingKey: "Private Key A",
        verificationKey: "Public Key B (different)",
        result: "✗ Invalid",
        reason: "Key mismatch",
    },
    {
        signingKey: "32-byte seed key",
        verificationKey: "Matching public key",
        result: "✓ Valid",
        reason: (
            <>
                <span className="text-blue-600 font-medium">(Go, Rust, Java)</span> - Seed expanded
                correctly
            </>
        ),
    },
    {
        signingKey: "64-byte expanded key",
        verificationKey: "Matching public key",
        result: "✓ Valid",
        reason: (
            <>
                <span className="text-purple-600 font-medium">(Python, Node.js, PHP)</span> - Full
                key used
            </>
        ),
    },
];

export const timestampScenarios: ScenarioRow[] = [
    {
        scenario: "Fresh header",
        created: "now - 5 min",
        expires: "now + 55 min",
        result: "✓ Valid",
    },
    {
        scenario: "Expired header",
        created: "now - 2 hours",
        expires: "now - 1 hour",
        result: "✗ Invalid (expired)",
    },
    {
        scenario: "Future header",
        created: "now + 1 hour",
        expires: "now + 2 hours",
        result: "✗ Invalid (not yet valid)",
    },
    {
        scenario: "Zero TTL",
        created: "now",
        expires: "now",
        result: "⚠ Marginal",
    },
];

export const payloadModificationScenarios: ScenarioRow[] = [
    {
        modificationType: "Value changed",
        example: '"price": 100 → "price": 200',
        result: "✗ Invalid",
        reason: "Content change = different hash",
    },
    {
        modificationType: "Key added",
        example: 'Added "extra_field": true',
        result: "✗ Invalid",
        reason: "Structure change = different hash",
    },
    {
        modificationType: "Key removed",
        example: 'Removed "optional_field"',
        result: "✗ Invalid",
        reason: "Structure change = different hash",
    },
    {
        modificationType: "Key order changed",
        example: "{ a, b } → { b, a }",
        result: "✗ Invalid",
        reason: "Byte sequence changed",
    },
    {
        modificationType: "Trailing newline",
        example: "{}\n vs {}",
        result: "✗ Invalid",
        reason: "Extra byte = different hash",
    },
];

export const commonIssues = [
    {
        issue: "JSON.parse() then JSON.stringify() during verification",
        solution: "Use raw request body",
    },
    {
        issue: "Using BLAKE2s instead of BLAKE2b",
        solution: "Ensure 64-byte (512-bit) output",
    },
    {
        issue: "URL-safe Base64 vs standard Base64",
        solution: "Use standard Base64 with +/= chars",
    },
    {
        issue: "Different newline characters (LF vs CRLF)",
        solution: "Use LF (\\n) consistently",
    },
    {
        issue: "Encoding differences (UTF-8 BOM)",
        solution: "Use UTF-8 without BOM",
    },
];
