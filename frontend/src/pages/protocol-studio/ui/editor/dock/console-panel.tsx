import { TrashIcon } from "@heroicons/react/24/outline";

import type { IConsolePanelProps } from "@pages/protocol-studio/ui/editor/types";

const formatTime = (time: Date) => time.toLocaleTimeString([], { hour12: false });

/** Editor log. Nothing executes yet, so it only carries the editor's own events. */
export const ConsolePanel = ({ entries, onClear }: IConsolePanelProps) => (
    <div className="studio-well flex h-full flex-col">
        <div className="studio-hairline-b flex items-center gap-2 px-3 py-1.5">
            <span className="studio-eyebrow">Output</span>
            <span className="studio-text-faint text-[11px]">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
            <button
                type="button"
                className="studio-key studio-key-xs ml-auto"
                onClick={onClear}
                disabled={entries.length === 0}
            >
                <TrashIcon />
                Clear
            </button>
        </div>
        <ol className="studio-mono min-h-0 flex-1 overflow-auto px-3 py-2 text-[12px] leading-5">
            {entries.length === 0 ? (
                <li className="studio-text-faint">Console is empty.</li>
            ) : (
                entries.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                        <time
                            className="studio-text-faint shrink-0"
                            dateTime={entry.time.toISOString()}
                        >
                            {formatTime(entry.time)}
                        </time>
                        <span className="studio-level" data-level={entry.level}>
                            {entry.level.toUpperCase()}
                        </span>
                        <span className="min-w-0 break-words">{entry.message}</span>
                    </li>
                ))
            )}
        </ol>
    </div>
);

export default ConsolePanel;
