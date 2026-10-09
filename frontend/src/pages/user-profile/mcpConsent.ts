import consentRaw from "./mcpConsent.md?raw";

/**
 * The consent version this build ships.
 *
 * Must match the server's `MCP_CONSENT_VERSION`, or `POST /user/mcp-key`
 * answers 409 and no key is issued. When the document text changes
 * meaningfully, bump it in three places together: the `**Version:**` line in
 * `mcpConsent.md`, this constant, and the server env var.
 *
 * The status endpoint also reports `current_consent_version`, so a mismatch is
 * detectable before asking anyone to read the document.
 */
export const MCP_CONSENT_VERSION = "2026-10-v1";

/**
 * The consent document, rendered by `GithubMarkdown` in the consent dialog.
 *
 * Section 12 of the source document is deliberately absent: it was a mock-up of
 * the agree checkbox and button, and rendering it as text would show the user
 * two of each. Its wording lives in `PROFILE_PAGE_COPY.mcpKey` instead, on the
 * real controls.
 */
export const MCP_CONSENT_MARKDOWN = typeof consentRaw === "string" ? consentRaw : "";
