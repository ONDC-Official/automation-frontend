import { FC } from "react";
import { FiChevronDown, FiMaximize2, FiMinimize2, FiRefreshCw } from "react-icons/fi";
import { KnowledgeSource } from "./types";
import { SOURCE_LABELS } from "./constants";

interface ChatHeaderProps {
    knowledgeSource: KnowledgeSource;
    setKnowledgeSource: (source: KnowledgeSource) => void;
    onReset: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}

const ChatHeader: FC<ChatHeaderProps> = ({
    knowledgeSource,
    setKnowledgeSource,
    onReset,
    isFullscreen,
    onToggleFullscreen,
}) => (
    <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 text-slate-800 px-5 py-4 border-b border-sky-200/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold tracking-tight text-sky-700 ring-1 ring-sky-200"
                    aria-hidden
                >
                    O
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight truncate m-0">
                        ONDC Workbench Chatbot
                    </h2>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                    <select
                        value={knowledgeSource}
                        onChange={(event) =>
                            setKnowledgeSource(event.target.value as KnowledgeSource)
                        }
                        className="h-9 appearance-none rounded-xl border border-sky-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 shadow-none transition-colors hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                    >
                        {(Object.keys(SOURCE_LABELS) as KnowledgeSource[]).map((key) => (
                            <option key={key} value={key}>
                                {SOURCE_LABELS[key]}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-sky-700">
                        <FiChevronDown className="h-3.5 w-3.5" />
                    </span>
                </div>

                <div className="group relative">
                    <button
                        type="button"
                        onClick={onReset}
                        aria-label="New Chat"
                        title="New Chat"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                    >
                        <FiRefreshCw className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        New Chat
                    </span>
                </div>
                <div className="group relative">
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                    >
                        {isFullscreen ? (
                            <FiMinimize2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                            <FiMaximize2 className="h-3.5 w-3.5" aria-hidden />
                        )}
                    </button>
                    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export default ChatHeader;
