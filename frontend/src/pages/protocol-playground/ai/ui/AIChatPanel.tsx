import { useContext, useState } from "react";

import { AIContext } from "../context/ai-context";
import { useChatSession } from "../hooks/use-chat-session";
import { AISettingsPanel } from "./AISettingsPanel";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { LockedBanner } from "./LockedBanner";

interface AIChatPanelProps {
    actionId: string | undefined;
}

export function AIChatPanel({ actionId: _actionId }: AIChatPanelProps) {
    const ai = useContext(AIContext);
    const [showSettings, setShowSettings] = useState(false);
    const { messages, isStreaming, sendMessage, stop, clear } = useChatSession();

    return (
        <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">AI assistant</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={clear}
                        disabled={isStreaming || messages.length === 0}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Clear chat
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowSettings((s) => !s)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        {showSettings ? "Hide settings" : "Settings"}
                    </button>
                </div>
            </div>

            {showSettings && <AISettingsPanel onClose={() => setShowSettings(false)} />}

            <LockedBanner />

            {!showSettings && (
                <>
                    <ChatMessageList messages={messages} isStreaming={isStreaming} />
                    <ChatComposer
                        onSend={sendMessage}
                        onStop={stop}
                        isStreaming={isStreaming}
                        disabled={!ai.isUnlocked}
                    />
                </>
            )}
        </div>
    );
}
