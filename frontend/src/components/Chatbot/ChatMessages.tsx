import { FC, RefObject } from "react";
import { ChatMessage } from "./types";

interface ChatMessagesProps {
    chatBoxRef: RefObject<HTMLDivElement>;
    messages: ChatMessage[];
    isStreaming: boolean;
    onToggleThinking: (messageId: string) => void;
    onToggleStepExpand: (messageId: string, stepId: string) => void;
}

const ChatMessages: FC<ChatMessagesProps> = ({
    chatBoxRef,
    messages,
    isStreaming,
    onToggleThinking: _onToggleThinking,
    onToggleStepExpand: _onToggleStepExpand,
}) => (
    <div ref={chatBoxRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
        <style>
            {`
                @keyframes chatbot-message-in {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes chatbot-panel-in {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes chatbot-loader-dot {
                    0%,
                    80%,
                    100% {
                        transform: scale(0.65);
                        opacity: 0.45;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}
        </style>
        {messages.map((message, index) => {
            const isUser = message.role === "user";
            const showStreamingLoader = !isUser && isStreaming && index === messages.length - 1;
            return (
                <div
                    key={message.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                    style={{
                        animation: `chatbot-message-in 220ms ease-out`,
                        animationDelay: `${Math.min(index * 30, 180)}ms`,
                        animationFillMode: "both",
                    }}
                >
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            isUser ? "bg-slate-800 text-white" : "bg-blue-100 text-blue-700"
                        }`}
                    >
                        {isUser ? "U" : "O"}
                    </div>

                    <div
                        className={`max-w-[88%] rounded-2xl border p-4 text-sm shadow-sm ${
                            isUser
                                ? "rounded-tr-none border-blue-500 bg-blue-600 text-white"
                                : "rounded-tl-none border-slate-200 bg-white text-slate-700"
                        }`}
                    >
                        {isUser ? (
                            <p className="whitespace-pre-wrap">{message.text}</p>
                        ) : (
                            <div
                                className="prose prose-sm max-w-none prose-pre:rounded-lg prose-pre:bg-slate-900 prose-code:before:content-[''] prose-code:after:content-['']"
                                dangerouslySetInnerHTML={{ __html: message.html }}
                            />
                        )}

                        {showStreamingLoader && (
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                <span className="inline-flex items-center gap-1" aria-hidden="true">
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-slate-500"
                                        style={{
                                            animation: "chatbot-loader-dot 1s infinite ease-in-out",
                                        }}
                                    />
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-slate-500"
                                        style={{
                                            animation: "chatbot-loader-dot 1s infinite ease-in-out",
                                            animationDelay: "0.15s",
                                        }}
                                    />
                                    <span
                                        className="h-1.5 w-1.5 rounded-full bg-slate-500"
                                        style={{
                                            animation: "chatbot-loader-dot 1s infinite ease-in-out",
                                            animationDelay: "0.3s",
                                        }}
                                    />
                                </span>
                                <span>Generating...</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
    </div>
);

export default ChatMessages;
