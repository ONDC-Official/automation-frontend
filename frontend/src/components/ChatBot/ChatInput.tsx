import React, { useRef, useEffect } from "react";

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    setInput: (value: string) => void;
    onSend: () => void;
}

const SendIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const ChatInput: React.FC<ChatInputProps> = ({ input, isLoading, setInput, onSend }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const canSend = input.trim() && !isLoading;

    return (
        <div
            className="flex-shrink-0 px-4 py-3 border-t bg-white"
            style={{ borderColor: "#e0f2fe" }}
        >
            <div
                className="flex items-end gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-200"
                style={{
                    background: "#f0f9ff",
                    border: "1.5px solid #bae6fd",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
                }}
                onFocus={() => {}}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about ONDC flows…"
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder-slate-400 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                />
                <button
                    onClick={onSend}
                    disabled={!canSend}
                    className="flex-shrink-0 w-7 h-7 rounded-lg text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                        background: canSend
                            ? "linear-gradient(135deg, #0369a1, #0284c7)"
                            : "#cbd5e1",
                        boxShadow: canSend ? "0 2px 8px rgba(2,132,199,0.4)" : "none",
                    }}
                >
                    <SendIcon />
                </button>
            </div>
            <p className="text-center text-slate-400 text-[10px] mt-1.5 select-none">
                Enter to send · Shift+Enter for new line
            </p>
        </div>
    );
};

export default ChatInput;
