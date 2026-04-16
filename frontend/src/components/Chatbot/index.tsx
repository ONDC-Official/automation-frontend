import {
    FC,
    KeyboardEvent as ReactKeyboardEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_KEY } from "./constants";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import {
    ChatMessage,
    ChatbotProps,
    KnowledgeSource,
    StreamContext,
    ThinkingStep,
    ThinkingStepType,
} from "./types";
import { describeArgs, getAssistantBaseUrl, getSessionId, parsePayloadString } from "./utils";

const FULLSCREEN_ANIMATION_MS = 300;
const WELCOME_MESSAGE =
    "Hello! I'm your ONDC expert assistant. Ask me about API specs, validation rules, or field definitions.";

marked.setOptions({
    breaks: true,
});

const Chatbot: FC<ChatbotProps> = ({ domain, version, flowId, actionId, actionApi }) => {
    const [knowledgeSource, setKnowledgeSource] = useState<KnowledgeSource>("all");
    const [sessionId, setSessionId] = useState<string>("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFullscreenMounted, setIsFullscreenMounted] = useState(false);
    const [input, setInput] = useState("");
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fullscreenCloseTimerRef = useRef<number | null>(null);

    const closeFullscreen = useCallback(() => {
        if (fullscreenCloseTimerRef.current) {
            window.clearTimeout(fullscreenCloseTimerRef.current);
            fullscreenCloseTimerRef.current = null;
        }
        setIsFullscreen(false);
        fullscreenCloseTimerRef.current = window.setTimeout(() => {
            setIsFullscreenMounted(false);
            fullscreenCloseTimerRef.current = null;
        }, FULLSCREEN_ANIMATION_MS);
    }, []);

    const addAgentWelcome = (text: string) => {
        const html = marked.parse(text) as string;
        setMessages([
            {
                id: uuidv4(),
                role: "agent",
                text,
                html,
                thinkingSteps: [],
                thinkingOpen: false,
                thinkingDone: true,
                expandedStepIds: {},
            },
        ]);
    };

    useEffect(() => {
        const existingSession = getSessionId();
        setSessionId(existingSession);
        addAgentWelcome(WELCOME_MESSAGE);
    }, []);

    useEffect(() => {
        if (!isFullscreenMounted) {
            return;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isFullscreenMounted]);

    useEffect(() => {
        if (!isFullscreenMounted) {
            return;
        }
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeFullscreen();
            }
        };
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [closeFullscreen, isFullscreenMounted]);

    useEffect(
        () => () => {
            if (fullscreenCloseTimerRef.current) {
                window.clearTimeout(fullscreenCloseTimerRef.current);
            }
        },
        []
    );

    const smartScroll = () => {
        const container = chatBoxRef.current;
        if (!container) {
            return;
        }
        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    };

    useEffect(() => {
        smartScroll();
    }, [messages, isStreaming]);

    const pushThinkingStep = (
        messageId: string,
        type: ThinkingStepType,
        label: string,
        detail?: string,
        expandable?: string
    ) => {
        const step: ThinkingStep = {
            id: uuidv4(),
            type,
            label,
            detail,
            expandable,
        };
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? {
                          ...message,
                          thinkingSteps: [...message.thinkingSteps, step],
                      }
                    : message
            )
        );
    };

    const closeThinkingPanel = (messageId: string) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? {
                          ...message,
                          thinkingOpen: false,
                          thinkingDone: true,
                      }
                    : message
            )
        );
    };

    const updateContent = (messageId: string, chunk: string, streamCtx: StreamContext) => {
        setMessages((prev) =>
            prev.map((message) => {
                if (message.id !== messageId) {
                    return message;
                }
                const nextText = `${message.text}${chunk}`;
                return {
                    ...message,
                    text: nextText,
                    html: marked.parse(nextText) as string,
                    thinkingOpen: streamCtx.contentStarted ? false : message.thinkingOpen,
                    thinkingDone: streamCtx.contentStarted ? true : message.thinkingDone,
                };
            })
        );
    };

    const handleEvent = (
        event: Record<string, unknown>,
        messageId: string,
        streamCtx: StreamContext
    ) => {
        const eventType = String(event.type ?? "");
        switch (eventType) {
            case "status":
                pushThinkingStep(messageId, "status", String(event.data ?? ""));
                break;
            case "thinking":
                pushThinkingStep(
                    messageId,
                    "status",
                    "Reasoning...",
                    String(event.data ?? "").slice(0, 80)
                );
                break;
            case "tool_start":
                pushThinkingStep(
                    messageId,
                    "tool",
                    String(event.name ?? "tool"),
                    describeArgs(event.args),
                    parsePayloadString(event.args)
                );
                break;
            case "tool_end":
                pushThinkingStep(
                    messageId,
                    "success",
                    `${String(event.name ?? "tool")} done`,
                    String(event.result ?? "").slice(0, 60),
                    parsePayloadString(event.result)
                );
                break;
            case "error":
                pushThinkingStep(messageId, "error", String(event.data ?? "Unknown error"));
                break;
            case "content":
                if (!streamCtx.contentStarted) {
                    streamCtx.contentStarted = true;
                    closeThinkingPanel(messageId);
                }
                updateContent(messageId, String(event.data ?? ""), streamCtx);
                break;
            default:
                break;
        }
    };

    const resetChat = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsStreaming(false);
        const nextSession = uuidv4();
        localStorage.setItem(STORAGE_KEY, nextSession);
        setSessionId(nextSession);
        addAgentWelcome("Chat reset. How can I help you?");
    };

    const stopStreaming = () => {
        abortControllerRef.current?.abort();
    };

    const sendMessage = async () => {
        const query = input.trim();
        if (!query || isStreaming) {
            return;
        }

        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: "user",
            text: query,
            html: "",
            thinkingSteps: [],
            thinkingOpen: false,
            thinkingDone: true,
            expandedStepIds: {},
        };

        const agentMessage: ChatMessage = {
            id: uuidv4(),
            role: "agent",
            text: "",
            html: "",
            thinkingSteps: [],
            thinkingOpen: true,
            thinkingDone: false,
            expandedStepIds: {},
        };

        setMessages((prev) => [...prev, userMessage, agentMessage]);
        setInput("");
        setIsStreaming(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const streamCtx: StreamContext = { contentStarted: false };
        let sseBuffer = "";

        try {
            const baseUrl = getAssistantBaseUrl();
            const response = await fetch(`${baseUrl}/search-stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    session_id: sessionId || getSessionId(),
                    query_from: knowledgeSource,
                    domain,
                    version,
                    flow_id: flowId,
                    action_id: actionId,
                    action_api: actionApi,
                }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                sseBuffer += decoder.decode(value, { stream: true });
                const frames = sseBuffer.split("\n\n");
                sseBuffer = frames.pop() ?? "";

                for (const frame of frames) {
                    for (const line of frame.split("\n")) {
                        if (!line.startsWith("data: ")) {
                            continue;
                        }
                        const payload = line.slice(6).trim();
                        if (payload === "[DONE]") {
                            break;
                        }
                        try {
                            const event = JSON.parse(payload) as Record<string, unknown>;
                            handleEvent(event, agentMessage.id, streamCtx);
                        } catch (error) {
                            console.warn("SSE parse error:", payload, error);
                        }
                    }
                }
            }
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                pushThinkingStep(agentMessage.id, "error", "Stopped by user");
            } else {
                pushThinkingStep(agentMessage.id, "error", "Connection error — check the server.");
            }
            closeThinkingPanel(agentMessage.id);
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
            closeThinkingPanel(agentMessage.id);
        }
    };

    const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage();
        }
    };

    const toggleThinking = (messageId: string) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? {
                          ...message,
                          thinkingOpen: !message.thinkingOpen,
                      }
                    : message
            )
        );
    };

    const toggleStepExpand = (messageId: string, stepId: string) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? {
                          ...message,
                          expandedStepIds: {
                              ...message.expandedStepIds,
                              [stepId]: !message.expandedStepIds[stepId],
                          },
                      }
                    : message
            )
        );
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            closeFullscreen();
            return;
        }
        if (fullscreenCloseTimerRef.current) {
            window.clearTimeout(fullscreenCloseTimerRef.current);
            fullscreenCloseTimerRef.current = null;
        }
        setIsFullscreenMounted(true);
        setIsFullscreen(true);
    };

    const renderChatbotPanel = (fullscreenVariant: boolean) => (
        <div
            className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
                fullscreenVariant
                    ? "h-full w-full rounded-none border-none shadow-2xl"
                    : "h-[min(760px,88vh)]"
            }`}
        >
            <ChatHeader
                knowledgeSource={knowledgeSource}
                setKnowledgeSource={setKnowledgeSource}
                onReset={resetChat}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
            />

            <ChatMessages
                chatBoxRef={chatBoxRef}
                messages={messages}
                isStreaming={isStreaming}
                onToggleThinking={toggleThinking}
                onToggleStepExpand={toggleStepExpand}
            />

            <ChatInput
                input={input}
                isStreaming={isStreaming}
                canSend={Boolean(input.trim())}
                showStop={isStreaming}
                onInputChange={setInput}
                onInputKeyDown={onInputKeyDown}
                onSend={() => void sendMessage()}
                onStop={stopStreaming}
            />
        </div>
    );

    return (
        <>
            <div
                className={`transition-opacity duration-300 ${
                    isFullscreenMounted ? "pointer-events-none opacity-100" : "opacity-100"
                }`}
            >
                {renderChatbotPanel(false)}
            </div>
            {isFullscreenMounted && (
                <div
                    role="presentation"
                    onClick={closeFullscreen}
                    className={`fixed inset-0 z-[90] transition-opacity duration-300 ease-out ${
                        isFullscreen ? "bg-slate-900/40 opacity-100" : "bg-slate-900/0 opacity-0"
                    }`}
                >
                    <div
                        role="presentation"
                        onClick={(event) => event.stopPropagation()}
                        className={`h-dvh w-screen transition-all duration-300 ease-out ${
                            isFullscreen
                                ? "translate-y-0 scale-100 opacity-100"
                                : "translate-y-2 scale-[0.99] opacity-0"
                        }`}
                    >
                        {renderChatbotPanel(true)}
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
