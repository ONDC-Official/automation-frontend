import { ReactNode, createContext, useContext } from "react";

import { useChatSession, type ChatMessage } from "../hooks/use-chat-session";

interface ChatSessionContextValue {
    messages: ChatMessage[];
    isStreaming: boolean;
    sendMessage: (text: string) => Promise<void>;
    stop: () => void;
    clear: () => void;
}

const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
    // Owning the chat session here (not inside AIChatPanel) keeps state alive
    // when the user switches tabs — RightSideView only mounts <AIChatPanel>
    // for the "ai_chat" tab, so without this lift, every tab change would
    // unmount the panel and wipe messages, abort controllers, and any
    // in-flight stream.
    const value = useChatSession();
    return (
        <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>
    );
}

export function useChatSessionContext(): ChatSessionContextValue {
    const v = useContext(ChatSessionContext);
    if (!v) {
        throw new Error(
            "useChatSessionContext must be used inside <ChatSessionProvider>"
        );
    }
    return v;
}
