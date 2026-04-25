import { useCallback, useContext, useRef, useState } from "react";
import { toast } from "react-toastify";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { getKey } from "@utils/secure-key-store";

import { createOpenAIClient } from "../client/openai-client";
import type { OpenAIMessage, StreamEvent } from "../client/types";
import { AIContext } from "../context/ai-context";
import { buildRuntimeContext } from "../prompt/context-injector";
import { buildSystemPrompt } from "../prompt/system-prompt";

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
    id: string;
    role: ChatMessageRole;
    content: string;
}

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatSession() {
    const ai = useContext(AIContext);
    const playground = useContext(PlaygroundContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const appendDelta = useCallback((id: string, delta: string) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m))
        );
    }, []);

    const finalizeAssistant = useCallback((id: string, errorText?: string) => {
        if (!errorText) return;
        setMessages((prev) =>
            prev.map((m) =>
                m.id === id
                    ? {
                          ...m,
                          content:
                              m.content.length > 0
                                  ? `${m.content}\n\n_${errorText}_`
                                  : `_${errorText}_`,
                      }
                    : m
            )
        );
    }, []);

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isStreaming) return;

            const gate = await ai.ensureUnlocked();
            if (gate !== "unlocked") return;

            const userMessage: ChatMessage = {
                id: makeId(),
                role: "user",
                content: trimmed,
            };
            const assistantId = makeId();
            const assistantMessage: ChatMessage = {
                id: assistantId,
                role: "assistant",
                content: "",
            };
            const history = messages;
            setMessages((prev) => [...prev, userMessage, assistantMessage]);
            setIsStreaming(true);

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const client = createOpenAIClient({
                    endpoint: ai.settings.endpoint,
                    apiKey: getKey(),
                    useProxy: ai.settings.useProxy,
                });

                const outgoing: OpenAIMessage[] = [
                    { role: "system", content: buildSystemPrompt() },
                    {
                        role: "system",
                        content: buildRuntimeContext({
                            config: playground.config,
                            activeApi: playground.activeApi,
                            terminalTail: playground.activeTerminalData,
                        }),
                    },
                    ...history.map((m) => ({ role: m.role, content: m.content })),
                    { role: "user", content: trimmed },
                ];

                const stream = client.chatCompletionsStream(
                    {
                        model: ai.settings.model,
                        messages: outgoing,
                        temperature: 0.3,
                    },
                    controller.signal
                );

                for await (const event of stream as AsyncIterable<StreamEvent>) {
                    if (controller.signal.aborted) break;
                    if (event.type === "content") {
                        appendDelta(assistantId, event.delta);
                    } else if (event.type === "error") {
                        finalizeAssistant(assistantId, `error: ${event.message}`);
                    }
                    // tool_call_delta / finish_reason are intentionally ignored in Phase 2.
                }
            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    finalizeAssistant(assistantId, "stopped by user");
                } else {
                    const message = err instanceof Error ? err.message : "request failed";
                    finalizeAssistant(assistantId, message);
                    toast.error(message);
                }
            } finally {
                setIsStreaming(false);
                abortRef.current = null;
            }
        },
        [
            ai,
            appendDelta,
            finalizeAssistant,
            isStreaming,
            messages,
            playground.activeApi,
            playground.activeTerminalData,
            playground.config,
        ]
    );

    const stop = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const clear = useCallback(() => {
        if (isStreaming) return;
        setMessages([]);
    }, [isStreaming]);

    return { messages, isStreaming, sendMessage, stop, clear };
}
