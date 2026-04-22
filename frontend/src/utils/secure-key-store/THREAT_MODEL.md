# Secure Key Store — Threat Model

This module stores a user-supplied LLM API key in the browser, encrypted with a
user-chosen passphrase. The decrypted key lives in JS memory only, and only for
the session.

## What this protects against

- **Disk forensics on a powered-off device.** The key at rest in IndexedDB is
  an AES-GCM ciphertext; without the passphrase, nothing can be recovered from
  a copied-off disk image.
- **Casual DevTools / IndexedDB / localStorage inspection.** An onlooker
  opening Application → Storage sees only ciphertext + salt + IV + metadata.
- **Device theft without the passphrase.** PBKDF2-SHA256 at 600,000 iterations
  makes offline dictionary attacks expensive enough that a strong passphrase
  provides meaningful protection.
- **Accidentally committing the key to source control.** The key is never
  written to any file on disk in plaintext and never flows through any code
  path that could be serialized into logs, exports, or commits.

## What this does NOT protect against

- **Active XSS inside the page.** Once the user unlocks, the plaintext key is
  present in JS memory and readable by any script running in the same origin.
  CSP, input sanitization, and dependency review are the defenses here — not
  this module.
- **Malicious browser extensions with script injection privileges.** Such an
  extension can read the DOM, intercept `fetch` requests, and read JS globals.
- **Compromised dependencies running on the page.** A malicious npm package
  pulled into the bundle can hook into `crypto.subtle`, `fetch`, or capture the
  passphrase from modal input events.
- **Weak user passphrases.** 600,000 iterations raises the cost of a GPU
  dictionary attack but does not make `password123` safe. Users who pick
  trivial passphrases against an exfiltrated DB dump remain vulnerable.
- **Keyloggers at the OS level.** The passphrase is typed into a DOM input.
  Anything watching keystrokes outside the browser sees it.

## Non-goals (deliberately omitted)

- No "remember passphrase" option. The passphrase is never persisted. Every
  page reload requires the user to re-enter it.
- No plaintext of the key or the passphrase in storage, logs, console, toast,
  telemetry, or analytics.
- No fallback crypto. Only WebCrypto `crypto.subtle` is used — no third-party
  crypto libraries, no hand-rolled primitives.
- No auto-unlock on focus or timeout renewal. The unlock is explicit and
  session-scoped.

## Crypto choices summary

| Parameter | Value | Rationale |
|---|---|---|
| KDF | PBKDF2-SHA256 | WebCrypto native; widely supported. |
| KDF iterations | 600,000 | OWASP 2023 recommendation for PBKDF2-SHA256. |
| Salt | 16 random bytes per setup | Defeats rainbow tables; unique per install. |
| Cipher | AES-GCM 256-bit | AEAD; auth tag detects wrong passphrase cleanly. |
| IV | 12 random bytes per encryption | GCM-recommended length; fresh per encryption. |
| Derived key extractable | `false` | Cannot be exfiltrated via WebCrypto. |
| Wrong passphrase signal | `OperationError` from `decrypt` → `InvalidPassphraseError` | Distinct typed error, not a generic crash. |
| Storage | IndexedDB | Binary-native, async, origin-scoped, versioned schema. |

## Operational guidance

- If you suspect compromise, call `clearKey()` to wipe both memory and the
  IndexedDB record, then re-run setup with a new API key (preferably a freshly
  rotated one at the provider).
- The in-memory plaintext is wiped on `beforeunload`. Closing or reloading the
  tab always re-prompts.
