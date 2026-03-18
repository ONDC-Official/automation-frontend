import React, { useRef, useEffect } from "react";

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    setInput: (value: string) => void;
    onSend: () => void;
}

const SendIcon: React.FC = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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

    return (
        <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-50 transition-all">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about ONDC flows..."
                    rows={1}
                    className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
                />
                <button
                    onClick={onSend}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-sky-600 to-sky-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:from-sky-500 hover:to-sky-400 transition-all shadow-sm"
                >
                    <SendIcon />
                </button>
            </div>
            <p className="text-center text-gray-300 text-[10px] mt-1.5">
                Enter to send · Shift+Enter for newline
            </p>
        </div>
    );
};

export default ChatInput;
