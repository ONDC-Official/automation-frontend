import React from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { Message } from "./types";

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    input: string;
    setInput: (value: string) => void;
    onSend: () => void;
    onClose: () => void;
    onClear: () => void;
}

const TrashIcon: React.FC = () => (
    <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isLoading,
    input,
    setInput,
    onSend,
    onClose,
    onClear,
}) => (
    <div className="flex flex-col w-80 h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-sky-600 to-sky-500 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                    </svg>
                </div>
                <div>
                    <p className="text-white text-xs font-semibold leading-tight">ONDC Assistant</p>
                    <p className="text-sky-200 text-[10px]">Always here to help</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={onClear}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    title="Clear chat"
                >
                    <TrashIcon />
                </button>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                    <CloseIcon />
                </button>
            </div>
        </div>

        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput input={input} isLoading={isLoading} setInput={setInput} onSend={onSend} />
    </div>
);

export default ChatWindow;
