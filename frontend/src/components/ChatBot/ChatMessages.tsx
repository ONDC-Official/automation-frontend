import React, { useEffect, useRef } from "react";
import { Message } from "./types";

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex gap-1 items-center px-3 py-2">
        {[0, 1, 2].map((i) => (
            <span
                key={i}
                className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
            />
        ))}
    </div>
);

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-sky-100">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                            msg.role === "user"
                                ? "bg-gradient-to-br from-sky-600 to-sky-500 text-white rounded-br-sm"
                                : "bg-gray-50 border border-gray-100 text-gray-700 rounded-bl-sm"
                        }`}
                    >
                        {msg.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                        <TypingIndicator />
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
