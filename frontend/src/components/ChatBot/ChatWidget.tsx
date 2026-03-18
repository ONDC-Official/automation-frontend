import React, { useState } from "react";
import ChatWindow from "./ChatWindow";
import { useChatbot } from "./useChatbot";

export const ChatIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        {/* Large sparkle */}
        <path d="M14 2l1.04 4.16a4 4 0 002.8 2.8L22 10l-4.16 1.04a4 4 0 00-2.8 2.8L14 18l-1.04-4.16a4 4 0 00-2.8-2.8L6 10l4.16-1.04a4 4 0 002.8-2.8L14 2z" />
        {/* Small sparkle */}
        <path d="M6 16l.52 2.08a2 2 0 001.4 1.4L10 20l-2.08.52a2 2 0 00-1.4 1.4L6 24l-.52-2.08a2 2 0 00-1.4-1.4L2 20l2.08-.52a2 2 0 001.4-1.4L6 16z" />
    </svg>
);

const CloseIcon = () => (
    <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChatWidget: React.FC = () => {
    const {
        messages,
        isOpen,
        isLoading,
        input,
        sendMessage,
        sendDirectMessage,
        toggleChat,
        setInput,
        clearMessages,
    } = useChatbot();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleToggleFullscreen = () => setIsFullscreen((prev) => !prev);

    const handleClose = () => {
        setIsFullscreen(false);
        toggleChat();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <div
                    className="origin-bottom-right"
                    style={{
                        animation: "chatSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    <ChatWindow
                        messages={messages}
                        isLoading={isLoading}
                        input={input}
                        setInput={setInput}
                        onSend={sendMessage}
                        onDirectSend={sendDirectMessage}
                        onClose={handleClose}
                        onClear={clearMessages}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={handleToggleFullscreen}
                    />
                </div>
            )}

            {/* FAB toggle button */}
            {!isFullscreen && (
                <button
                    onClick={toggleChat}
                    className="relative w-12 h-12 rounded-2xl text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)",
                        boxShadow: isOpen
                            ? "0 4px 20px rgba(2, 132, 199, 0.35)"
                            : "0 4px 24px rgba(2, 132, 199, 0.45)",
                    }}
                    aria-label="Toggle chat"
                >
                    {/* Pulse ring when closed */}
                    {!isOpen && (
                        <span
                            className="absolute inset-0 rounded-2xl opacity-40"
                            style={{ animation: "chatPulse 2.5s ease-in-out infinite" }}
                        />
                    )}
                    <span className="relative z-10 transition-transform duration-200">
                        {isOpen ? <CloseIcon /> : <ChatIcon />}
                    </span>
                </button>
            )}

            <style>{`
                @keyframes chatSlideIn {
                    from { opacity: 0; transform: scale(0.92) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
                @keyframes chatPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.5); }
                    50%      { box-shadow: 0 0 0 10px rgba(2, 132, 199, 0); }
                }
            `}</style>
        </div>
    );
};

export default ChatWidget;
