/**
 * MCP API key endpoints on user-management.
 *
 * The key itself is a bearer secret, not a public key: it is returned exactly
 * once by `generateMcpKey` and only its SHA-256 hash is stored server-side.
 * Nothing in this app may persist it.
 */

/** Metadata about the user's key. Never contains the key or its hash. */
export interface IMcpKeyStatus {
    has_key: boolean;
    /**
     * The consent version the server will accept right now. Compare against the
     * bundled MCP_CONSENT_VERSION to catch a stale frontend before asking
     * someone to read the whole document.
     */
    current_consent_version: string;
    /** Non-secret display hint, e.g. "ondc_mcp_AbC1x2". */
    key_hint?: string;
    /** The consent version in force when this key was issued. */
    consent_version?: string;
    created_at?: string;
    expires_at?: string;
    /** Absent until the key is first used by an MCP server. */
    last_used_at?: string;
    /** True when the key exists but has passed `expires_at`. */
    expired: boolean;
}

export interface IGenerateMcpKeyRequest {
    consent_version: string;
    consent_accepted: boolean;
}

/** The only response that ever carries the plaintext key. */
export interface IGenerateMcpKeyResponse {
    key: string;
    key_hint: string;
    consent_version: string;
    created_at: string;
    expires_at: string;
}

export interface IRevokeMcpKeyResponse {
    revoked: boolean;
}

/** 409 body when the submitted consent version is not the one in force. */
export interface IMcpConsentMismatch {
    error: "consent_version_mismatch";
    expected_consent_version: string;
}
