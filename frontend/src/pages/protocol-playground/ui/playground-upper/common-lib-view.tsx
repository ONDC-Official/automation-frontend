import { useContext, useEffect, useRef } from "react";
import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { decodeBase64 } from "@pages/protocol-playground/utils/base64";
import { CodeEditor } from "@/components/PayloadEditor";
import { PLAYGROUND_EDITOR_OPTIONS } from "@pages/protocol-playground/constants";

export default function CommonLibView() {
    const playgroundContext = useContext(PlaygroundContext);

    const getEditorContent = () => {
        try {
            const value = playgroundContext.config?.helperLib || "";
            return decodeBase64(value);
        } catch (e) {
            console.error("Error decoding helper library content:", e);
            return "Error decoding helper library content.";
        }
    };

    const pendingRef = useRef<{ timer: number | null; flush: (() => void) | null }>({
        timer: null,
        flush: null,
    });

    const handleEditorChange = (value: string | undefined) => {
        if (value === undefined) return;
        if (pendingRef.current.timer !== null) {
            window.clearTimeout(pendingRef.current.timer);
        }
        pendingRef.current.flush = () => playgroundContext.updateHelperLib(value);
        pendingRef.current.timer = window.setTimeout(() => {
            pendingRef.current.flush?.();
            pendingRef.current.timer = null;
            pendingRef.current.flush = null;
        }, 150);
    };

    useEffect(
        () => () => {
            if (pendingRef.current.timer !== null) {
                window.clearTimeout(pendingRef.current.timer);
                pendingRef.current.flush?.();
                pendingRef.current.timer = null;
                pendingRef.current.flush = null;
            }
        },
        []
    );

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col self-stretch overflow-hidden border rounded-lg mt-2">
            <CodeEditor
                editorKey="common-helper"
                language="javascript"
                defaultValue={getEditorContent()}
                onChange={handleEditorChange}
                className="h-full w-full"
                options={{
                    ...PLAYGROUND_EDITOR_OPTIONS,
                    formatOnPaste: true,
                    formatOnType: true,
                }}
            />
        </div>
    );
}
