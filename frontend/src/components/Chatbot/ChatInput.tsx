import { FC, KeyboardEvent } from "react";
import { FiSend, FiSquare } from "react-icons/fi";

interface ChatInputProps {
    input: string;
    isStreaming: boolean;
    canSend: boolean;
    showStop: boolean;
    onInputChange: (value: string) => void;
    onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onSend: () => void;
    onStop: () => void;
}

const ChatInput: FC<ChatInputProps> = ({
    input,
    isStreaming,
    canSend,
    showStop,
    onInputChange,
    onInputKeyDown,
    onSend,
    onStop,
}) => (
    <div className="border-t border-slate-200 bg-white p-3">
        <div className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {isStreaming && (
                    <div className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2">
                        <div
                            className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-500"
                            style={{ animation: "chat-input-spinner 0.8s linear infinite" }}
                        />
                    </div>
                )}
                <input
                    type="text"
                    value={input}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder={isStreaming ? "Streaming response..." : "Type your ONDC query..."}
                    disabled={isStreaming}
                    className={`flex-1 bg-transparent py-2 text-sm text-slate-700 placeholder-slate-400 outline-none disabled:cursor-not-allowed disabled:opacity-70 px-2`}
                />
                {showStop ? (
                    <button
                        type="button"
                        onClick={onStop}
                        className="rounded-xl bg-red-100 p-2.5 text-red-600 transition-colors hover:bg-red-200"
                        title="Stop generating"
                    >
                        <FiSquare className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={!canSend}
                        className="rounded-xl bg-blue-600 p-2.5 text-white transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        title="Send"
                    >
                        <FiSend className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
        <style>{`
            @keyframes chat-input-spinner {
                to {
                    transform: rotate(360deg);
                }
            }
        `}</style>
    </div>
);

export default ChatInput;
