import React from "react";
import ChatWindow from "./ChatWindow";
import { useChatbot } from "./useChatbot";

const ChatIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChatWidget: React.FC = () => {
    const { messages, isOpen, isLoading, input, sendMessage, toggleChat, setInput, clearMessages } =
        useChatbot();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    input={input}
                    setInput={setInput}
                    onSend={sendMessage}
                    onClose={toggleChat}
                    onClear={clearMessages}
                />
            )}
            <button
                onClick={toggleChat}
                className="w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 text-white shadow-lg hover:shadow-sky-200 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
                aria-label="Toggle chat"
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>
        </div>
    );
};

export default ChatWidget;
