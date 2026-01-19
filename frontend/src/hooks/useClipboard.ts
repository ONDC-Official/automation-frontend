import { useState, useCallback } from "react";

const COPY_SUCCESS_DURATION = 2000;

/**
 * Hook to copy text to the clipboard and expose a transient "copied" flag.
 * Sets copied true on success for a short duration so UIs can show feedback.
 */

export const useClipboard = () => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);
        } catch (error) {
            console.error("Failed to copy text to clipboard:", error);
        }
    }, []);

    return { copied, copyToClipboard };
};
