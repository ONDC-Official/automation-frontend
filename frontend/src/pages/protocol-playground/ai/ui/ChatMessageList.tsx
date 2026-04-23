import { useEffect, useMemo, useRef } from "react";
import { marked } from "marked";

import type { ChatMessage } from "../hooks/use-chat-session";

interface ChatMessageListProps {
    messages: ChatMessage[];
    isStreaming: boolean;
}

function renderMarkdown(text: string): string {
    try {
        const html = marked.parse(text, { async: false, breaks: true }) as string;
        return html;
    } catch {
        return text;
    }
}

export function ChatMessageList({ messages, isStreaming }: ChatMessageListProps) {
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isStreaming]);

    const rendered = useMemo(
        () =>
            messages.map((m) => ({
                ...m,
                html: m.role === "assistant" ? renderMarkdown(m.content) : null,
            })),
        [messages]
    );

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 border border-dashed border-gray-300 rounded">
                Ask about the current step, session data, or what to fix next.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            {rendered.map((m) => (
                <div
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm border ${
                        m.role === "user"
                            ? "bg-sky-50 border-sky-200 self-end max-w-[85%]"
                            : "bg-white border-gray-200 self-start max-w-[95%]"
                    }`}
                >
                    {m.role === "assistant" ? (
                        <div
                            className="prose prose-sm max-w-none [&_pre]:bg-gray-100 [&_pre]:rounded [&_pre]:p-2 [&_code]:text-xs"
                            dangerouslySetInnerHTML={{ __html: m.html ?? "" }}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                </div>
            ))}
            {isStreaming && (
                <div className="text-xs text-gray-500 self-start">assistant is typing…</div>
            )}
            <div ref={endRef} />
        </div>
    );
}
