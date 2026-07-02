import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLazyGetPayloadsBySessionIdQuery } from "@store/api";

export const useSessionLogs = (sessionId: string) => {
    const [hasPayloads, setHasPayloads] = useState(true);
    const [downloadingLogs, setDownloadingLogs] = useState(false);
    const [triggerGetPayloadsBySessionId] = useLazyGetPayloadsBySessionIdQuery();

    useEffect(() => {
        let cancelled = false;

        const checkPayloads = async () => {
            try {
                const result = await triggerGetPayloadsBySessionId({ sessionId });
                if (result.error) throw result.error;
                if (!cancelled) setHasPayloads((result.data?.length ?? 0) > 0);
            } catch {
                if (!cancelled) setHasPayloads(false);
            }
        };

        checkPayloads();

        return () => {
            cancelled = true;
        };
    }, [sessionId, triggerGetPayloadsBySessionId]);

    const handleDownloadLogs = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!hasPayloads || downloadingLogs) return;

        setDownloadingLogs(true);
        try {
            const result = await triggerGetPayloadsBySessionId({ sessionId });
            if (result.error) throw result.error;
            const payloads = result.data;
            const blob = new Blob([JSON.stringify(payloads, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${sessionId}-logs.json`;
            document.body.appendChild(anchor);
            anchor.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(anchor);
        } catch (error) {
            console.error("Error downloading logs: ", error);
            toast.error("Failed to download logs");
        } finally {
            setDownloadingLogs(false);
        }
    };

    return { hasPayloads, downloadingLogs, handleDownloadLogs };
};
