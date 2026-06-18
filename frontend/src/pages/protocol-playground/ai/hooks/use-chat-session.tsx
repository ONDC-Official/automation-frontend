import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import { getKey, onLock } from "@utils/secure-key-store";

import { createOpenAIClient } from "../client/openai-client";
import type { OpenAIMessage, OpenAIToolCall, StreamEvent } from "../client/types";
import { AIContext } from "../context/ai-context";
import { buildRuntimeContext } from "../prompt/context-injector";
import { buildSystemPrompt } from "../prompt/system-prompt";
import { TOOL_DESCRIPTIONS } from "../prompt/tool-descriptions";
import { createReadToolRegistry } from "../tools/registry";
import type { ToolContext } from "../tools/types";
import { usePendingApprovals } from "./use-pending-approvals";

const MAX_TOOL_ITERATIONS = 15;

export interface UserMessage {
    id: string;
    role: "user";
    content: string;
}

export interface AssistantToolCall {
    id: string;
    name: string;
    argsJson: string;
}

export interface AssistantMessage {
    id: string;
    role: "assistant";
    content: string;
    toolCalls?: AssistantToolCall[];
}

export interface ToolMessage {
    id: string;
    role: "tool";
    toolCallId: string;
    toolName: string;
    argsJson: string;
    status: "running" | "done" | "error";
    resultText?: string;
    errorText?: string;
}

export type ChatMessage = UserMessage | AssistantMessage | ToolMessage;

function makeId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeForWire(messages: ChatMessage[]): OpenAIMessage[] {
    return messages.map((m) => {
        if (m.role === "user") {
            return { role: "user", content: m.content };
        }
        if (m.role === "assistant") {
            const hasToolCalls = !!(m.toolCalls && m.toolCalls.length > 0);
            // Spec requires content: null (not "") when an assistant message
            // carries tool_calls and no text. Anthropic-via-OpenAI-compat,
            // OpenRouter, Groq etc. silently return empty completions on the
            // next round-trip if we send "" — manifests as the chat freezing
            // after the user approves/rejects a propose_step_edit.
            const out: OpenAIMessage = {
                role: "assistant",
                content: hasToolCalls && m.content === "" ? null : m.content,
            };
            if (hasToolCalls) {
                out.tool_calls = m.toolCalls!.map<OpenAIToolCall>((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: { name: tc.name, arguments: tc.argsJson },
                }));
            }
            return out;
        }
        return {
            role: "tool",
            tool_call_id: m.toolCallId,
            name: m.toolName,
            content: m.errorText ?? m.resultText ?? "",
        };
    });
}

interface ToolCallAccumulator {
    id: string;
    name: string;
    argsBuf: string;
}

export function useChatSession() {
    const ai = useContext(AIContext);
    const playground = useContext(PlaygroundContext);
    const approvals = usePendingApprovals();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const lastAssistantIdRef = useRef<string | null>(null);
    const abortReasonRef = useRef<"user" | "lock" | null>(null);
    const registry = useMemo(() => createReadToolRegistry(), []);

    const updateMessage = useCallback((id: string, patch: (m: ChatMessage) => ChatMessage) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
    }, []);

    const finalizeAssistantNote = useCallback(
        (id: string, note: string) => {
            updateMessage(id, (m) =>
                m.role === "assistant"
                    ? {
                          ...m,
                          content: m.content.length > 0 ? `${m.content}\n\n_${note}_` : `_${note}_`,
                      }
                    : m
            );
        },
        [updateMessage]
    );

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isStreaming) return;

            const gate = await ai.ensureUnlocked();
            if (gate !== "unlocked") return;

            const userMessage: UserMessage = {
                id: makeId(),
                role: "user",
                content: trimmed,
            };
            setMessages((prev) => [...prev, userMessage]);
            setIsStreaming(true);

            const controller = new AbortController();
            abortRef.current = controller;

            const client = createOpenAIClient({
                endpoint: ai.settings.endpoint,
                apiKey: getKey(),
                useProxy: ai.settings.useProxy,
            });

            const baseSystem: OpenAIMessage[] = [
                { role: "system", content: buildSystemPrompt() },
                {
                    role: "system",
                    content: buildRuntimeContext({
                        config: playground.config,
                        activeApi: playground.activeApi,
                        terminalTail: playground.activeTerminalData,
                    }),
                },
            ];

            // Local mirror of conversation we'll resend on each iteration.
            // We append assistant + tool messages locally as they finalize so
            // subsequent round-trips see the full history without needing to
            // read from React state.
            let conversation: ChatMessage[] = [...messages, userMessage];
            let lastAssistantId: string | null = null;
            abortReasonRef.current = null;

            try {
                for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
                    if (controller.signal.aborted) break;

                    const assistantId = makeId();
                    lastAssistantId = assistantId;
                    lastAssistantIdRef.current = assistantId;
                    const assistantMessage: AssistantMessage = {
                        id: assistantId,
                        role: "assistant",
                        content: "",
                    };
                    setMessages((prev) => [...prev, assistantMessage]);

                    const outgoing: OpenAIMessage[] = [
                        ...baseSystem,
                        ...serializeForWire(conversation),
                    ];

                    const stream = client.chatCompletionsStream(
                        {
                            model: ai.settings.model,
                            messages: outgoing,
                            temperature: 0.3,
                            tools: TOOL_DESCRIPTIONS,
                            tool_choice: "auto",
                        },
                        controller.signal
                    );

                    const accumulators = new Map<number, ToolCallAccumulator>();
                    let assistantContent = "";
                    let finishReason: string | undefined;
                    let streamErrored = false;

                    for await (const event of stream as AsyncIterable<StreamEvent>) {
                        if (controller.signal.aborted) break;
                        if (event.type === "content") {
                            assistantContent += event.delta;
                            updateMessage(assistantId, (m) =>
                                m.role === "assistant"
                                    ? { ...m, content: m.content + event.delta }
                                    : m
                            );
                        } else if (event.type === "tool_call_delta") {
                            const acc = accumulators.get(event.index) ?? {
                                id: "",
                                name: "",
                                argsBuf: "",
                            };
                            if (event.id) acc.id = event.id;
                            if (event.name) acc.name = event.name;
                            if (event.argumentsDelta) acc.argsBuf += event.argumentsDelta;
                            accumulators.set(event.index, acc);
                        } else if (event.type === "finish_reason") {
                            finishReason = event.reason;
                        } else if (event.type === "error") {
                            finalizeAssistantNote(assistantId, `error: ${event.message}`);
                            streamErrored = true;
                        }
                    }

                    if (controller.signal.aborted || streamErrored) break;

                    if (finishReason !== "tool_calls" || accumulators.size === 0) {
                        // Plain stop — no tool calls. Mirror the assistant message
                        // into our conversation copy and exit the loop.
                        if (assistantContent === "" && iter > 0) {
                            // Model produced no follow-up after a tool round —
                            // surface a hint so the chat doesn't appear frozen.
                            finalizeAssistantNote(
                                assistantId,
                                "AI stopped without a follow-up — try asking again."
                            );
                        }
                        conversation = [
                            ...conversation,
                            {
                                id: assistantId,
                                role: "assistant",
                                content: assistantContent,
                            },
                        ];
                        break;
                    }

                    // The model wants to call tools.
                    const finalizedToolCalls: AssistantToolCall[] = Array.from(
                        accumulators.entries()
                    )
                        .sort(([a], [b]) => a - b)
                        .map(([, acc]) => ({
                            id: acc.id || makeId(),
                            name: acc.name,
                            argsJson: acc.argsBuf,
                        }));

                    updateMessage(assistantId, (m) =>
                        m.role === "assistant" ? { ...m, toolCalls: finalizedToolCalls } : m
                    );

                    const toolMessages: ToolMessage[] = [];
                    for (const tc of finalizedToolCalls) {
                        if (controller.signal.aborted) break;
                        const toolMsgId = makeId();
                        const running: ToolMessage = {
                            id: toolMsgId,
                            role: "tool",
                            toolCallId: tc.id,
                            toolName: tc.name,
                            argsJson: tc.argsJson,
                            status: "running",
                        };
                        setMessages((prev) => [...prev, running]);

                        const ctx: ToolContext = {
                            config: playground.config,
                            activeApi: playground.activeApi,
                            terminalTail: playground.activeTerminalData,
                            toolCallId: tc.id,
                            updateStepMock: playground.updateStepMock,
                            requestApproval: approvals.request,
                        };
                        const outcome = await registry.execute(tc.name, tc.argsJson, ctx);
                        const finished: ToolMessage = outcome.ok
                            ? {
                                  ...running,
                                  status: "done",
                                  resultText: outcome.resultText,
                              }
                            : {
                                  ...running,
                                  status: "error",
                                  errorText: outcome.errorText,
                              };
                        updateMessage(toolMsgId, () => finished);
                        toolMessages.push(finished);
                    }
                    if (controller.signal.aborted) break;

                    conversation = [
                        ...conversation,
                        {
                            id: assistantId,
                            role: "assistant",
                            content: assistantContent,
                            toolCalls: finalizedToolCalls,
                        },
                        ...toolMessages,
                    ];

                    if (iter === MAX_TOOL_ITERATIONS - 1) {
                        const noteId = makeId();
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: noteId,
                                role: "assistant",
                                content: "_stopped: tool-loop limit reached_",
                            },
                        ]);
                    }
                }
            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    const reason = abortReasonRef.current;
                    const note =
                        reason === "lock"
                            ? "paused — API key locked. Unlock to continue."
                            : "stopped by user";
                    if (lastAssistantId) finalizeAssistantNote(lastAssistantId, note);
                } else {
                    const message = err instanceof Error ? err.message : "request failed";
                    if (lastAssistantId) finalizeAssistantNote(lastAssistantId, message);
                    toast.error(message);
                }
            } finally {
                setIsStreaming(false);
                abortRef.current = null;
                abortReasonRef.current = null;
                lastAssistantIdRef.current = null;
            }
        },
        [
            ai,
            approvals,
            finalizeAssistantNote,
            isStreaming,
            messages,
            playground.activeApi,
            playground.activeTerminalData,
            playground.config,
            playground.updateStepMock,
            registry,
            updateMessage,
        ]
    );

    const stop = useCallback(() => {
        abortReasonRef.current = "user";
        abortRef.current?.abort();
        // Cancel any pending edit approvals so the tool promise resolves with
        // applied=false and the loop can continue or unwind cleanly.
        approvals.cancelAll(false);
    }, [approvals]);

    // If the secure key store locks while a stream is active, abort it and
    // surface a "paused — locked" note. LockedBanner already prompts unlock.
    useEffect(() => {
        const off = onLock(() => {
            if (!abortRef.current) return;
            abortReasonRef.current = "lock";
            abortRef.current.abort();
            approvals.cancelAll(false);
        });
        return off;
    }, [approvals]);

    const clear = useCallback(() => {
        if (isStreaming) return;
        setMessages([]);
    }, [isStreaming]);

    return { messages, isStreaming, sendMessage, stop, clear };
}
