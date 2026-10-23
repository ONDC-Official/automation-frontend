import {
    ChevronDownIcon,
    ChevronUpIcon,
    CommandLineIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

import { AiChatPanel } from "@pages/protocol-studio/ui/editor/dock/ai-chat-panel";
import { ConsolePanel } from "@pages/protocol-studio/ui/editor/dock/console-panel";
import type { DockTab, IBottomDockProps } from "@pages/protocol-studio/ui/editor/types";

const DOCK_TABS: { id: DockTab; label: string; Icon: typeof CommandLineIcon }[] = [
    { id: "console", label: "Console", Icon: CommandLineIcon },
    { id: "ai", label: "AI Chat", Icon: SparklesIcon },
];

/**
 * Bottom panel under the canvas. Collapsed it is just its tab bar; clicking a
 * tab opens it, clicking the open tab collapses it again.
 */
export const BottomDock = ({
    open,
    tab,
    isHidden,
    onSelectTab,
    onToggleOpen,
    resizeHandleProps,
    graphSummary,
    entries,
    onClearConsole,
    messages,
    onSendMessage,
    onClearChat,
}: IBottomDockProps) => (
    <section
        className="studio-glass studio-dock flex flex-col"
        aria-label="Console and AI chat"
        data-open={open || undefined}
        inert={isHidden}
    >
        {open ? (
            <div
                className="studio-handle studio-handle-y"
                aria-label="Resize panel"
                title="Drag to resize · double-click to reset"
                {...resizeHandleProps}
            />
        ) : null}

        <div className="flex h-10 shrink-0 items-center gap-1.5 px-1.5" role="tablist">
            {DOCK_TABS.map(({ id, label, Icon }) => {
                const isActive = open && tab === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className="studio-key studio-key-sm"
                        data-active={isActive || undefined}
                        onClick={() => onSelectTab(id)}
                    >
                        <Icon />
                        {label}
                        {id === "console" && entries.length > 0 ? (
                            <span className="studio-count">{entries.length}</span>
                        ) : null}
                    </button>
                );
            })}
            <span className="studio-mono studio-text-faint ml-auto pr-1 text-[11px]">
                {graphSummary}
            </span>
            <button
                type="button"
                className="studio-key studio-key-sm studio-key-icon"
                onClick={onToggleOpen}
                aria-expanded={open}
                aria-label={open ? "Collapse panel" : "Expand panel"}
            >
                {open ? <ChevronDownIcon /> : <ChevronUpIcon />}
            </button>
        </div>

        {open ? (
            <div className="min-h-0 flex-1 px-1.5 pb-1.5" role="tabpanel">
                {tab === "console" ? (
                    <ConsolePanel entries={entries} onClear={onClearConsole} />
                ) : (
                    <AiChatPanel messages={messages} onSend={onSendMessage} onClear={onClearChat} />
                )}
            </div>
        ) : null}
    </section>
);

export default BottomDock;
