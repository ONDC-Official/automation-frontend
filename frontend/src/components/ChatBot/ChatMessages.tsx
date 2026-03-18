import React, { useEffect, useRef } from "react";
import { Message } from "./types";

const BotAvatar = () => (
    <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{
            background: "linear-gradient(135deg, #0a2540 0%, #0284c7 100%)",
            boxShadow: "0 2px 8px rgba(2,132,199,0.3)",
        }}
    >
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2l1.04 4.16a4 4 0 002.8 2.8L22 10l-4.16 1.04a4 4 0 00-2.8 2.8L14 18l-1.04-4.16a4 4 0 00-2.8-2.8L6 10l4.16-1.04a4 4 0 002.8-2.8L14 2z" />
            <path d="M6 16l.52 2.08a2 2 0 001.4 1.4L10 20l-2.08.52a2 2 0 00-1.4 1.4L6 24l-.52-2.08a2 2 0 00-1.4-1.4L2 20l2.08-.52a2 2 0 001.4-1.4L6 16z" />
        </svg>
    </div>
);

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
}
const TypingIndicator = () => (
    <div className="flex gap-1 items-center px-4 py-3">
        {[0, 1, 2].map((i) => (
            <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                    background: "linear-gradient(135deg, #0c4a6e, #0284c7)",
                    animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    opacity: 0.7,
                }}
            />
        ))}
        <style>{`
            @keyframes typingBounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                30%            { transform: translateY(-5px); opacity: 1; }
            }
        `}</style>
    </div>
);

const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    return (
        <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
            style={{
                background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 25%)",
                scrollbarWidth: "thin",
                scrollbarColor: "#bae6fd transparent",
            }}
        >
            {messages.map((msg) =>
                msg.role === "user" ? (
                    /* User message */
                    <div key={msg.id} className="flex justify-end">
                        <div className="flex flex-col items-end gap-1 max-w-[80%]">
                            <div
                                className="px-4 py-2.5 rounded-2xl rounded-br-sm text-[13px] leading-relaxed text-white"
                                style={{
                                    background: "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
                                    boxShadow: "0 2px 10px rgba(2,132,199,0.28)",
                                }}
                            >
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1">
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Assistant message */
                    <div key={msg.id} className="flex items-start gap-2.5">
                        <BotAvatar />
                        <div className="flex flex-col items-start gap-1 max-w-[80%]">
                            <div
                                className="px-4 py-2.5 rounded-2xl rounded-bl-sm text-[13px] leading-relaxed text-slate-700"
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #e0f2fe",
                                    boxShadow: "0 1px 6px rgba(2,132,199,0.08)",
                                }}
                            >
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 px-1">
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                )
            )}

            {isLoading && (
                <div className="flex items-start gap-2.5">
                    <BotAvatar />
                    <div
                        className="rounded-2xl rounded-bl-sm"
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e0f2fe",
                            boxShadow: "0 1px 6px rgba(2,132,199,0.08)",
                        }}
                    >
                        <TypingIndicator />
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
