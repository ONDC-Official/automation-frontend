import { FormEvent, KeyboardEvent, useState } from "react";

interface ChatComposerProps {
    onSend: (text: string) => void | Promise<void>;
    onStop: () => void;
    isStreaming: boolean;
    disabled?: boolean;
}

export function ChatComposer({ onSend, onStop, isStreaming, disabled }: ChatComposerProps) {
    const [value, setValue] = useState("");

    const submit = async () => {
        const text = value.trim();
        if (!text || disabled || isStreaming) return;
        setValue("");
        await onSend(text);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        void submit();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={disabled}
                placeholder={
                    disabled
                        ? "Unlock AI to chat..."
                        : "Ask anything. Enter to send, Shift+Enter for newline."
                }
                className="border bg-white border-gray-300 rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50"
            />
            <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-500">
                    Context includes the active step and recent terminal output.
                </div>
                <div className="flex gap-2">
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={onStop}
                            className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={disabled || !value.trim()}
                            className="px-3 py-1.5 text-sm rounded bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                            Send
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
