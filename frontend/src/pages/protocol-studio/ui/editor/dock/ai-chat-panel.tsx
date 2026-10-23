import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PaperAirplaneIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";

import { AI_CHAT_SUGGESTIONS } from "@pages/protocol-studio/ui/editor/constants";
import type { IAiChatPanelProps } from "@pages/protocol-studio/ui/editor/types";

/** Chat layout only: no model is connected, every reply is a fixed placeholder. */
export const AiChatPanel = ({ messages, onSend, onClear }: IAiChatPanelProps) => {
    const [draft, setDraft] = useState("");
    const listRef = useRef<HTMLDivElement>(null);
    const canSend = draft.trim().length > 0;

    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [messages]);

    const send = () => {
        const text = draft.trim();
        if (!text) return;
        onSend(text);
        setDraft("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="studio-well flex h-full flex-col">
            <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
                <SparklesIcon className="studio-accent-ink size-3.5" aria-hidden="true" />
                <span className="studio-eyebrow">Assistant</span>
                <span className="studio-badge">not connected</span>
                <button
                    type="button"
                    className="studio-key studio-key-xs ml-auto"
                    onClick={onClear}
                    disabled={messages.length === 0}
                >
                    <TrashIcon />
                    Clear
                </button>
            </div>

            <div
                ref={listRef}
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 py-2.5"
                aria-live="polite"
            >
                {messages.length === 0 ? (
                    <div className="m-auto flex flex-col items-center gap-3 text-center">
                        <p className="studio-text-dim text-[13px]">Ask about this config</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {AI_CHAT_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className="studio-key studio-key-xs"
                                    onClick={() => setDraft(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <p key={message.id} className="studio-bubble" data-role={message.role}>
                            {message.text}
                        </p>
                    ))
                )}
            </div>

            <form
                className="studio-hairline-t flex items-end gap-2 p-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
            >
                <textarea
                    className="studio-input flex-1"
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the assistant…  (Enter to send · Shift+Enter for a new line)"
                    aria-label="Message"
                />
                <button
                    type="submit"
                    className="studio-key studio-key-icon"
                    data-active={canSend || undefined}
                    disabled={!canSend}
                    aria-label="Send"
                >
                    <PaperAirplaneIcon />
                </button>
            </form>
        </div>
    );
};

export default AiChatPanel;
