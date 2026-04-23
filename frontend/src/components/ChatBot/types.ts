export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface ChatState {
    messages: Message[];
    isOpen: boolean;
    isLoading: boolean;
    input: string;
}

export interface ChatActions {
    sendMessage: () => Promise<void>;
    toggleChat: () => void;
    setInput: (value: string) => void;
    clearMessages: () => void;
}
