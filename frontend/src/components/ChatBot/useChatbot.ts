import { useState, useCallback } from "react";
import { Message, ChatState, ChatActions } from "./types";

const createMessage = (role: Message["role"], content: string): Message => ({
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp: new Date(),
});

export const useChatbot = (): ChatState & ChatActions => {
    const [messages, setMessages] = useState<Message[]>([
        createMessage(
            "assistant",
            "Hi! I'm your ONDC Workbench assistant. Ask me anything about flow testing, schema validation, or ONDC protocols."
        ),
    ]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [input, setInput] = useState<string>("");

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage = createMessage("user", trimmed);
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 800));
        setMessages((prev) => [
            ...prev,
            createMessage(
                "assistant",
                "This feature is coming soon! Our team is working on connecting the assistant."
            ),
        ]);
        setIsLoading(false);
    }, [input, isLoading]);

    const sendDirectMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading) return;

            const userMessage = createMessage("user", trimmed);
            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setIsLoading(true);

            await new Promise((resolve) => setTimeout(resolve, 800));
            setMessages((prev) => [
                ...prev,
                createMessage(
                    "assistant",
                    "This feature is coming soon! Our team is working on connecting the assistant."
                ),
            ]);
            setIsLoading(false);
        },
        [isLoading]
    );

    const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);
    const clearMessages = useCallback(
        () =>
            setMessages([
                createMessage(
                    "assistant",
                    "Hi! I'm your ONDC Workbench assistant. Ask me anything about flow testing, schema validation, or ONDC protocols."
                ),
            ]),
        []
    );

    return {
        messages,
        isOpen,
        isLoading,
        input,
        sendMessage,
        sendDirectMessage,
        toggleChat,
        setInput,
        clearMessages,
    };
};
