import { useState } from "react";
import { PiShieldStarBold } from "react-icons/pi";

import { Button } from "@/components/Shadcn/Button";
import { useAi } from "../hooks/use-ai";
import type { ChatMessage } from "../hooks/use-chat-session";
import { AISettingsPanel } from "./AISettingsPanel";
import { AvailableToolsBar } from "./AvailableToolsBar";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { LockedBanner } from "./LockedBanner";
import { ToolInspectorModal } from "./inspector/ToolInspectorModal";
import { isDev } from "@/types/environment";

interface AIChatPanelProps {
    actionId: string | undefined;
    messages: ChatMessage[];
    isStreaming: boolean;
    sendMessage: (text: string) => Promise<void>;
    stop: () => void;
    clear: () => void;
}

export function AIChatPanel({
    actionId: _actionId,
    messages,
    isStreaming,
    sendMessage,
    stop,
    clear,
}: AIChatPanelProps) {
    const ai = useAi();
    const [showSettings, setShowSettings] = useState(false);
    const [inspectorOpen, setInspectorOpen] = useState(false);

    return (
        <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-linear-to-br from-sky-500 to-indigo-600 text-white shadow-xs shrink-0">
                        <PiShieldStarBold className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-bold tracking-wide text-gray-900 uppercase truncate">
                            Protocol Guardian
                        </span>
                        <span className="text-[10px] text-gray-500 truncate">
                            ONDC flow co-pilot
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={clear}
                        disabled={isStreaming || messages.length === 0}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Clear chat
                    </Button>
                    {isDev && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setInspectorOpen(true)}
                            title="Invoke individual tools without the LLM (dev)"
                            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            🔧 Inspect tools
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowSettings((s) => !s)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        {showSettings ? "Hide settings" : "Settings"}
                    </Button>
                </div>
            </div>

            {showSettings && <AISettingsPanel onClose={() => setShowSettings(false)} />}

            <LockedBanner />

            {!showSettings && (
                <>
                    <AvailableToolsBar />
                    <ChatMessageList messages={messages} isStreaming={isStreaming} />
                    <ChatComposer
                        onSend={sendMessage}
                        onStop={stop}
                        isStreaming={isStreaming}
                        disabled={!ai.isUnlocked}
                    />
                </>
            )}

            {isDev && (
                <ToolInspectorModal
                    isOpen={inspectorOpen}
                    onClose={() => setInspectorOpen(false)}
                />
            )}
        </div>
    );
}
