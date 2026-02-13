import React, { useState } from "react";
import {
    FaHashtag,
    FaKey,
    FaFileCode,
    FaArrowRight,
    FaRobot,
    FaCopy,
    FaCheck,
} from "react-icons/fa";

const AI_PROMPT = `Generate two functions for ONDC authorization header creation and verification in [YOUR_LANGUAGE/FRAMEWORK].

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

const AlgorithmDocs: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(AI_PROMPT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Overview */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">ONDC Authorization Header</h2>
                <p className="text-gray-700 leading-relaxed">
                    ONDC uses a cryptographic signature scheme to authenticate API requests between
                    network participants. The authorization header contains a digital signature
                    created using <strong>BLAKE-512</strong> hashing and <strong>Ed25519</strong>{" "}
                    elliptic curve signatures.
                </p>
            </div>

            {/* Signing Process Flow */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Signing Process Flow</h3>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg font-medium">
                        JSON Payload
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium">
                        BLAKE2b-512 Hash
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                        Create Signing String
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium">
                        Ed25519 Sign
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-lg font-medium">
                        Base64 Encode
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium">
                        Auth Header
                    </div>
                </div>
            </div>

            {/* Verification Process Flow */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Verification Process Flow</h3>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium">
                        Auth Header
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-medium">
                        Parse Header
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium">
                        Hash Payload
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                        Reconstruct Signing String
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium">
                        Ed25519 Verify
                    </div>
                    <FaArrowRight className="text-gray-400" />
                    <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-medium">
                        ✓ Valid / ✗ Invalid
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* BLAKE-512 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <FaHashtag className="text-amber-600 text-xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">BLAKE2b-512 Hashing</h3>
                    </div>
                    <div className="space-y-3 text-gray-700">
                        <p>
                            BLAKE2b is a cryptographic hash function faster than MD5 and SHA-1,
                            while providing security comparable to SHA-3.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>
                                <strong>Output size:</strong> 512 bits (64 bytes)
                            </li>
                            <li>
                                <strong>Purpose:</strong> Creates a fixed-size digest of the payload
                            </li>
                            <li>
                                <strong>Property:</strong> Any change to payload produces completely
                                different hash
                            </li>
                        </ul>
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                            <code className="text-xs text-gray-800">
                                digest = BLAKE2b-512(payload) → 64 bytes → Base64 encoded
                            </code>
                        </div>
                    </div>
                </div>

                {/* Ed25519 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <FaKey className="text-purple-600 text-xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Ed25519 Signatures</h3>
                    </div>
                    <div className="space-y-3 text-gray-700">
                        <p>
                            Ed25519 is an elliptic curve digital signature algorithm using
                            Curve25519. It provides high security with small key sizes.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>
                                <strong>Private key:</strong> 32 bytes (seed) or 64 bytes (expanded)
                            </li>
                            <li>
                                <strong>Public key:</strong> 32 bytes
                            </li>
                            <li>
                                <strong>Signature:</strong> 64 bytes
                            </li>
                            <li>
                                <strong>Security:</strong> ~128-bit security level
                            </li>
                        </ul>
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                            <code className="text-xs text-gray-800">
                                signature = Ed25519.sign(private_key, signing_string)
                            </code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Format */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <FaFileCode className="text-indigo-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Header Format</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                            Signing String Structure:
                        </h4>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-green-400 text-sm font-mono">
                                {`(created): {unix_timestamp}
(expires): {unix_timestamp + ttl}
digest: BLAKE-512={base64_hash}`}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                            Authorization Header Format:
                        </h4>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                                {`Signature keyId="{subscriber_id}|{unique_key_id}|ed25519",
algorithm="ed25519",
created="{timestamp}",
expires="{timestamp + ttl}",
headers="(created) (expires) digest",
signature="{base64_signature}"`}
                            </pre>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Key Parameters:</h4>
                        <ul className="text-sm text-blue-900 space-y-1">
                            <li>
                                <strong>keyId:</strong> Format is
                                "subscriber_id|unique_key_id|ed25519"
                            </li>
                            <li>
                                <strong>created/expires:</strong> Unix timestamps for validity
                                window
                            </li>
                            <li>
                                <strong>ttl:</strong> Typically 3600 seconds (1 hour)
                            </li>
                            <li>
                                <strong>signature:</strong> Base64-encoded Ed25519 signature
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* AI Prompt Generator */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                            <FaRobot className="text-violet-600 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                Generate for Your Tech Stack
                            </h3>
                            <p className="text-sm text-gray-600">
                                Copy this prompt to ChatGPT, Gemini, Claude, or any LLM
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                        {copied ? (
                            <>
                                <FaCheck />
                                Copied!
                            </>
                        ) : (
                            <>
                                <FaCopy />
                                Copy Prompt
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                        {AI_PROMPT}
                    </pre>
                </div>

                <div className="mt-4 bg-violet-100 border border-violet-300 rounded-lg p-3">
                    <p className="text-sm text-violet-800">
                        <strong>💡 Tip:</strong> Replace{" "}
                        <code className="bg-violet-200 px-1 rounded">
                            [YOUR_LANGUAGE/FRAMEWORK]
                        </code>{" "}
                        with your preferred tech stack (e.g., "Rust", "C#/.NET", "Ruby on Rails",
                        "Kotlin", "Swift") before pasting to the AI.
                    </p>
                </div>
            </div>

            {/* FAQ / Test Scenarios */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Test Scenarios & FAQs</h3>
                <p className="text-gray-600 mb-6">
                    Common scenarios and their expected outcomes when signing and verifying ONDC
                    authorization headers.
                </p>

                {/* Payload Format Scenarios */}
                <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        📦 Payload Format Scenarios
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Signing Payload
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Verification Payload
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Result
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Reason
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Minified JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Same Minified JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Exact byte match
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Formatted JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Same Formatted JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Exact byte match
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Minified JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Formatted JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Different bytes = different hash
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Formatted JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Minified JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Different bytes = different hash
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        JSON with spaces
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        JSON with tabs
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Whitespace affects hash
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Original JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Re-serialized JSON
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Parsing + stringify changes format
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Key Scenarios */}
                <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">🔑 Key Scenarios</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Signing Key
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Verification Key
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Result
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Reason / Language Support
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Private Key A
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Public Key A (matching)
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Correct key pair
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Private Key A
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Public Key B (different)
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Key mismatch
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        32-byte seed key
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Matching public key
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <span className="text-blue-600 font-medium">
                                            (Go, Rust, Java)
                                        </span>{" "}
                                        - Seed expanded correctly
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        64-byte expanded key
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Matching public key
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <span className="text-purple-600 font-medium">
                                            (Python, Node.js, PHP)
                                        </span>{" "}
                                        - Full key used
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>📌 Key Size by Language:</strong>
                            <br />• <strong>32-byte (seed):</strong> Go, Rust, Java (BouncyCastle)
                            <br />• <strong>64-byte (expanded):</strong> Python (PyNaCl), Node.js
                            (libsodium), PHP (sodium)
                            <br />• <strong>Both supported:</strong> Our implementations handle both
                            formats automatically
                        </p>
                    </div>
                </div>

                {/* Timestamp Scenarios */}
                <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        ⏰ Timestamp Scenarios
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Scenario
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Created
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Expires
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Result
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Fresh header
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now - 5 min
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now + 55 min
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-semibold">
                                        ✓ Valid
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Expired header
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now - 2 hours
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now - 1 hour
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid (expired)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Future header
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now + 1 hour
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        now + 2 hours
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid (not yet valid)
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">Zero TTL</td>
                                    <td className="border border-gray-300 px-4 py-2">now</td>
                                    <td className="border border-gray-300 px-4 py-2">now</td>
                                    <td className="border border-gray-300 px-4 py-2 text-amber-600 font-semibold">
                                        ⚠ Marginal
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payload Modification Scenarios */}
                <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        📝 Payload Modification Scenarios
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Modification Type
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Example
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Result
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">
                                        Reason
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Value changed
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        "price": 100 → "price": 200
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Content change = different hash
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">Key added</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Added "extra_field": true
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Structure change = different hash
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Key removed
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Removed "optional_field"
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Structure change = different hash
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                        Key order changed
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {"{"} a, b {"}"} → {"{"} b, a {"}"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Byte sequence changed
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Trailing newline
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {"{}\\n"} vs {"{}"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-red-600 font-semibold">
                                        ✗ Invalid
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        Extra byte = different hash
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Common Issues */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-800 mb-3">
                        ⚠️ Common Implementation Issues
                    </h4>
                    <ul className="text-sm text-amber-900 space-y-2">
                        <li>
                            <strong>Issue:</strong> JSON.parse() then JSON.stringify() during
                            verification → <strong>Solution:</strong> Use raw request body
                        </li>
                        <li>
                            <strong>Issue:</strong> Using BLAKE2s instead of BLAKE2b →{" "}
                            <strong>Solution:</strong> Ensure 64-byte (512-bit) output
                        </li>
                        <li>
                            <strong>Issue:</strong> URL-safe Base64 vs standard Base64 →{" "}
                            <strong>Solution:</strong> Use standard Base64 with +/= chars
                        </li>
                        <li>
                            <strong>Issue:</strong> Different newline characters (LF vs CRLF) →{" "}
                            <strong>Solution:</strong> Use LF (\n) consistently
                        </li>
                        <li>
                            <strong>Issue:</strong> Encoding differences (UTF-8 BOM) →{" "}
                            <strong>Solution:</strong> Use UTF-8 without BOM
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AlgorithmDocs;
