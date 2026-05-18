import { useEffect, useRef } from "react";
import { PiShieldStarBold } from "react-icons/pi";
import { marked } from "marked";

import type { ChatMessage } from "../hooks/use-chat-session";
import { ProposeEditCard } from "./ProposeEditCard";
import { ToolCallCard } from "./ToolCallCard";

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

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded p-4">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow">
                    <PiShieldStarBold className="h-5 w-5" />
                </span>
                <div className="font-semibold tracking-wide uppercase text-gray-700 text-xs">
                    Protocol Guardian
                </div>
                <div className="max-w-xs">
                    Ask about the current step, session data, or what to fix next.
                </div>
            </div>
        );
    }

    // Identify the trailing-empty assistant placeholder so we can replace it with
    // a "thinking…" indicator while we wait for the first delta or tool_call.
    const lastIdx = messages.length - 1;

    return (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            {messages.map((m, idx) => {
                if (m.role === "user") {
                    return (
                        <div
                            key={m.id}
                            className="rounded-lg px-3 py-2 text-sm border bg-sky-50 border-sky-200 self-end max-w-[85%]"
                        >
                            <div className="whitespace-pre-wrap break-words">
                                {m.content}
                            </div>
                        </div>
                    );
                }
                if (m.role === "tool") {
                    if (m.toolName === "propose_step_edit") {
                        return <ProposeEditCard key={m.id} message={m} />;
                    }
                    return <ToolCallCard key={m.id} message={m} />;
                }

                const hasContent = m.content.trim().length > 0;
                const hasToolCalls = !!(m.toolCalls && m.toolCalls.length > 0);

                if (!hasContent && !hasToolCalls) {
                    if (idx === lastIdx && isStreaming) {
                        return (
                            <div
                                key={m.id}
                                className="self-start text-xs text-gray-500 italic flex items-center gap-2"
                            >
                                <PiShieldStarBold className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
                                Protocol Guardian is thinking…
                            </div>
                        );
                    }
                    // Stale empty assistant placeholder (e.g. aborted run) — drop it.
                    return null;
                }

                if (!hasContent && hasToolCalls) {
                    return (
                        <div
                            key={m.id}
                            className="self-start text-xs text-gray-500 italic flex items-center gap-2"
                        >
                            <PiShieldStarBold className="h-3.5 w-3.5 text-sky-600" />
                            calling {m.toolCalls!.length === 1 ? "tool" : "tools"}:{" "}
                            <span className="font-mono">
                                {m.toolCalls!.map((t) => t.name).join(", ")}
                            </span>
                        </div>
                    );
                }

                return (
                    <div key={m.id} className="self-start max-w-[95%] flex gap-2">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white shrink-0 mt-0.5">
                            <PiShieldStarBold className="h-3.5 w-3.5" />
                        </span>
                        <div className="rounded-lg px-3 py-2 text-sm border bg-white border-gray-200 flex-1 min-w-0">
                            <div
                                className="prose prose-sm max-w-none [&_pre]:bg-gray-100 [&_pre]:rounded [&_pre]:p-2 [&_code]:text-xs"
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(m.content),
                                }}
                            />
                            {hasToolCalls && (
                                <div className="mt-2 text-[11px] text-gray-500 italic">
                                    used:{" "}
                                    <span className="font-mono">
                                        {m.toolCalls!.map((t) => t.name).join(", ")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={endRef} />
        </div>
    );
}
