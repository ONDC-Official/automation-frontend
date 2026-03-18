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
    onDirectSend: (text: string) => void;
    onClose: () => void;
    onClear: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

const QUICK_PROMPTS = [
    "How do I test buyer flows?",
    "Explain schema validation",
    "How to configure a new session?",
    "What is seller onboarding?",
    "How do I read flow logs?",
];

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

const CloseIcon = () => (
    <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ExpandIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
    </svg>
);

const CollapseIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
        />
    </svg>
);

const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isLoading,
    input,
    setInput,
    onSend,
    onDirectSend,
    onClose,
    onClear,
    isFullscreen,
    onToggleFullscreen,
}) => {
    /* ─── Fullscreen layout ─── */
    if (isFullscreen) {
        return (
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center"
                style={{
                    background: "rgba(2, 12, 24, 0.5)",
                    backdropFilter: "blur(5px)",
                    WebkitBackdropFilter: "blur(5px)",
                    animation: "fsOverlayIn 0.28s ease both",
                }}
            >
                <style>{`
                    @keyframes fsOverlayIn {
                        from { opacity: 0; }
                        to   { opacity: 1; }
                    }
                    @keyframes fsCardIn {
                        from { opacity: 0; transform: scale(0.88) translateY(16px); }
                        to   { opacity: 1; transform: scale(1)    translateY(0); }
                    }
                `}</style>
                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)",
                        }}
                    />
                    <div
                        className="absolute -bottom-32 -right-32 w-[380px] h-[380px] rounded-full blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle, rgba(14,165,233,0.14), transparent 70%)",
                        }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-5"
                        style={{ background: "radial-gradient(ellipse, #38bdf8, transparent)" }}
                    />
                </div>

                {/* Chat container */}
                <div
                    className="relative z-10 flex overflow-hidden rounded-2xl"
                    style={{
                        width: "calc(100vw - 64px)",
                        height: "calc(100vh - 64px)",
                        maxWidth: "1100px",
                        maxHeight: "820px",
                        boxShadow:
                            "0 32px 80px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
                        animation: "fsCardIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
                    }}
                >
                    {/* ── Left sidebar ── */}
                    <div
                        className="w-64 flex-shrink-0 flex flex-col border-r border-white/10"
                        style={{
                            background:
                                "linear-gradient(180deg, #0d2744 0%, #10355a 50%, #0f3f6a 100%)",
                        }}
                    >
                        {/* Profile */}
                        <div className="px-6 pt-8 pb-6 border-b border-white/10">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                    background:
                                        "linear-gradient(135deg, rgba(56,189,248,0.25), rgba(2,132,199,0.15))",
                                    border: "1px solid rgba(56,189,248,0.25)",
                                    boxShadow: "0 4px 24px rgba(56,189,248,0.12)",
                                }}
                            >
                                <svg
                                    className="w-6 h-6 text-sky-300"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M14 2l1.04 4.16a4 4 0 002.8 2.8L22 10l-4.16 1.04a4 4 0 00-2.8 2.8L14 18l-1.04-4.16a4 4 0 00-2.8-2.8L6 10l4.16-1.04a4 4 0 002.8-2.8L14 2z" />
                                    <path d="M6 16l.52 2.08a2 2 0 001.4 1.4L10 20l-2.08.52a2 2 0 00-1.4 1.4L6 24l-.52-2.08a2 2 0 00-1.4-1.4L2 20l2.08-.52a2 2 0 001.4-1.4L6 16z" />
                                </svg>
                            </div>
                            <h2 className="text-white font-semibold text-sm tracking-tight">
                                ONDC Assistant
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    style={{
                                        boxShadow: "0 0 6px rgba(52,211,153,0.8)",
                                    }}
                                />
                                <span className="text-sky-300/90 text-[11px]">
                                    Online · Ready to help
                                </span>
                            </div>
                        </div>

                        {/* Quick prompts */}
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <p className="text-sky-300/80 text-[10px] uppercase tracking-[0.12em] font-semibold mb-3">
                                Quick Questions
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {QUICK_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => onDirectSend(prompt)}
                                        disabled={isLoading}
                                        className="group text-left text-[12px] leading-snug px-3 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            color: "rgba(224,242,254,0.90)",
                                            border: "1px solid rgba(255,255,255,0.10)",
                                        }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background = "rgba(56,189,248,0.15)";
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.borderColor = "rgba(56,189,248,0.40)";
                                            (e.currentTarget as HTMLButtonElement).style.color =
                                                "rgba(255,255,255,1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.background = "transparent";
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.borderColor = "rgba(255,255,255,0.10)";
                                            (e.currentTarget as HTMLButtonElement).style.color =
                                                "rgba(224,242,254,0.90)";
                                        }}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer note */}
                        <div className="px-5 pb-6">
                            <div
                                className="rounded-xl px-3.5 py-3"
                                style={{
                                    background: "rgba(56,189,248,0.08)",
                                    border: "1px solid rgba(56,189,248,0.18)",
                                }}
                            >
                                <p className="text-sky-200/80 text-[11px] leading-relaxed">
                                    Covers flow testing, schema validation &amp; ONDC protocols.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Right chat panel ── */}
                    <div className="flex-1 flex flex-col bg-white min-w-0">
                        {/* Sub-header */}
                        <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-2.5">
                                <span className="text-sm font-semibold text-slate-700">
                                    Conversation
                                </span>
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                    {messages.length} message
                                    {messages.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={onClear}
                                    className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all duration-150"
                                    title="Clear chat"
                                >
                                    <TrashIcon />
                                </button>
                                <button
                                    onClick={onToggleFullscreen}
                                    className="w-7 h-7 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 flex items-center justify-center transition-all duration-150"
                                    title="Exit fullscreen"
                                >
                                    <CollapseIcon />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all duration-150"
                                    title="Close"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <ChatMessages messages={messages} isLoading={isLoading} />
                        <ChatInput
                            input={input}
                            isLoading={isLoading}
                            setInput={setInput}
                            onSend={onSend}
                        />
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Normal (widget) layout ─── */
    return (
        <div
            className="flex flex-col w-96 h-[580px] bg-white rounded-2xl overflow-hidden"
            style={{
                boxShadow:
                    "0 20px 60px -10px rgba(2,132,199,0.25), 0 8px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(186,230,253,0.5)",
            }}
        >
            {/* Header */}
            <div
                className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
                style={{
                    background: "linear-gradient(135deg, #0a2540 0%, #0369a1 60%, #0284c7 100%)",
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.22)",
                            }}
                        >
                            <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M14 2l1.04 4.16a4 4 0 002.8 2.8L22 10l-4.16 1.04a4 4 0 00-2.8 2.8L14 18l-1.04-4.16a4 4 0 00-2.8-2.8L6 10l4.16-1.04a4 4 0 002.8-2.8L14 2z" />
                                <path d="M6 16l.52 2.08a2 2 0 001.4 1.4L10 20l-2.08.52a2 2 0 00-1.4 1.4L6 24l-.52-2.08a2 2 0 00-1.4-1.4L2 20l2.08-.52a2 2 0 001.4-1.4L6 16z" />
                            </svg>
                        </div>
                        <span
                            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-sky-900 rounded-full"
                            style={{ boxShadow: "0 0 5px rgba(52,211,153,0.7)" }}
                        />
                    </div>
                    <div>
                        <p className="text-white text-[13px] font-semibold leading-tight tracking-tight">
                            ONDC Assistant
                        </p>
                        <p className="text-sky-200/60 text-[10px] leading-tight mt-0.5">
                            Ask me anything
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onClear}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all duration-150"
                        title="Clear chat"
                    >
                        <TrashIcon />
                    </button>
                    <button
                        onClick={onToggleFullscreen}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all duration-150"
                        title="Fullscreen"
                    >
                        <ExpandIcon />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/40 text-white/60 hover:text-white flex items-center justify-center transition-all duration-150"
                        title="Close"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <ChatMessages messages={messages} isLoading={isLoading} />
                <ChatInput
                    input={input}
                    isLoading={isLoading}
                    setInput={setInput}
                    onSend={onSend}
                />
            </div>
        </div>
    );
};

export default ChatWindow;
