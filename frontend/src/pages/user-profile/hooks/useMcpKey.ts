import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
    useGenerateMcpKeyMutation,
    useGetMcpKeyStatusQuery,
    useRevokeMcpKeyMutation,
} from "@store/api";
import { MCP_CONSENT_VERSION } from "@pages/user-profile/mcpConsent";
import { PROFILE_PAGE_COPY } from "@pages/user-profile/constants";

const copy = PROFILE_PAGE_COPY.mcpKey;

/**
 * Owns every piece of MCP key state for the profile section.
 *
 * The plaintext key lives in this hook's local state and nowhere else: not in
 * Redux, not in redux-persist, not in storage. It is cleared when the reveal
 * dialog closes, which is the only moment the user can copy it.
 */
export const useMcpKey = () => {
    const { data: status, isLoading, isFetching } = useGetMcpKeyStatusQuery();
    const [generateMcpKey, { isLoading: isGenerating }] = useGenerateMcpKeyMutation();
    const [revokeMcpKey, { isLoading: isRevoking }] = useRevokeMcpKeyMutation();

    const [isConsentOpen, setConsentOpen] = useState(false);
    const [isRevokeOpen, setRevokeOpen] = useState(false);
    const [issuedKey, setIssuedKey] = useState<string | null>(null);
    const [issuedExpiresAt, setIssuedExpiresAt] = useState<string | null>(null);

    /**
     * True when the server has moved past the consent version this build
     * bundles. Generating would 409, so the UI blocks it and asks for a reload
     * rather than letting someone read a stale document and then fail.
     */
    const isConsentStale = Boolean(
        status?.current_consent_version && status.current_consent_version !== MCP_CONSENT_VERSION
    );

    const openConsent = useCallback(() => setConsentOpen(true), []);
    const closeConsent = useCallback(() => setConsentOpen(false), []);
    const openRevoke = useCallback(() => setRevokeOpen(true), []);
    const closeRevoke = useCallback(() => setRevokeOpen(false), []);

    const confirmConsent = useCallback(async () => {
        try {
            const result = await generateMcpKey({
                consent_version: MCP_CONSENT_VERSION,
                consent_accepted: true,
            }).unwrap();

            setConsentOpen(false);
            setIssuedKey(result.key);
            setIssuedExpiresAt(result.expires_at);
        } catch {
            // Keep the consent dialog open so the user can retry without
            // re-reading the document.
            toast.error(copy.generateError);
        }
    }, [generateMcpKey]);

    /** Drops the plaintext key. Called when the reveal dialog is dismissed. */
    const dismissIssuedKey = useCallback(() => {
        setIssuedKey(null);
        setIssuedExpiresAt(null);
    }, []);

    const confirmRevoke = useCallback(async () => {
        try {
            await revokeMcpKey().unwrap();
            setRevokeOpen(false);
            toast.success(copy.revokeSuccess);
        } catch {
            toast.error(copy.revokeError);
        }
    }, [revokeMcpKey]);

    return {
        status,
        // isFetching covers the refetch after generate/revoke, so the card does
        // not flash stale state.
        isLoading: isLoading || isFetching,
        isConsentStale,

        isConsentOpen,
        openConsent,
        closeConsent,
        confirmConsent,
        isGenerating,

        issuedKey,
        issuedExpiresAt,
        dismissIssuedKey,

        isRevokeOpen,
        openRevoke,
        closeRevoke,
        confirmRevoke,
        isRevoking,
    };
};
