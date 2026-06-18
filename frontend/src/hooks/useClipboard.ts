import { useCallback } from "react";
import { toast } from "sonner";

const COPY_SUCCESS_MESSAGE = "Copied to clipboard";
const COPY_ERROR_MESSAGE = "Failed to copy to clipboard";

export const useClipboard = () => {
    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(COPY_SUCCESS_MESSAGE);
            return true;
        } catch (error) {
            console.error("Failed to copy text to clipboard:", error);
            toast.error(COPY_ERROR_MESSAGE);
            return false;
        }
    }, []);

    return { copyToClipboard };
};
