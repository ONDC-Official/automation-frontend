import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type { JourneyCandidate } from "@pages/protocol-studio/ui/editor/journeys/derive";

export interface IDeriveDialogProps {
    open: boolean;
    container: HTMLElement | null;
    candidates: JourneyCandidate[];
    truncated: boolean;
    /** Paths existing journeys already walk, by `JourneyCandidate.key`. */
    existing: ReadonlySet<string>;
    onClose: () => void;
    onCreate: (picked: { candidate: JourneyCandidate; title: string }[]) => void;
}

/**
 * "Derive journeys…": every way through the protocol, each a candidate with
 * a proposed title from the options it takes. Tick the ones to keep.
 */
export const DeriveDialog = ({
    open,
    container,
    candidates,
    truncated,
    existing,
    onClose,
    onCreate,
}: IDeriveDialogProps) => {
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [titles, setTitles] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        setPicked(new Set(candidates.filter((c) => !existing.has(c.key)).map((c) => c.key)));
        setTitles(Object.fromEntries(candidates.map((c) => [c.key, c.title])));
    }, [open, candidates, existing]);

    const toggle = (key: string) =>
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay className="studio-dialog-overlay" />
                <DialogPrimitive.Content className="studio-glass studio-form-dialog studio-form-dialog-wide">
                    <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                        <SparklesIcon className="studio-code-dialog-icon" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="studio-code-dialog-title">
                                Derive journeys
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="studio-text-dim truncate text-[12px]">
                                {candidates.length} {candidates.length === 1 ? "way" : "ways"}{" "}
                                through the protocol{truncated ? " (first page)" : ""} · titles come
                                from the options each takes
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            className="studio-key studio-key-icon"
                            aria-label="Close"
                        >
                            <XMarkIcon />
                        </DialogPrimitive.Close>
                    </header>

                    <div className="studio-form-dialog-body">
                        <ul className="studio-well studio-picklist studio-picklist-tall">
                            {candidates.length === 0 ? (
                                <li className="studio-text-faint px-3 py-3 text-[12px]">
                                    Nothing to derive: the protocol has no entry node yet.
                                </li>
                            ) : null}
                            {candidates.map((candidate) => {
                                const exists = existing.has(candidate.key);
                                return (
                                    <li
                                        key={candidate.key}
                                        className="studio-candidate"
                                        data-exists={exists || undefined}
                                    >
                                        <label className="studio-pick">
                                            <input
                                                type="checkbox"
                                                checked={picked.has(candidate.key)}
                                                onChange={() => toggle(candidate.key)}
                                            />
                                            <input
                                                className="bp-input studio-candidate-title"
                                                value={titles[candidate.key] ?? candidate.title}
                                                onChange={(e) =>
                                                    setTitles((prev) => ({
                                                        ...prev,
                                                        [candidate.key]: e.target.value,
                                                    }))
                                                }
                                                onClick={(e) => e.preventDefault()}
                                            />
                                            <span className="studio-text-faint shrink-0 text-[11px]">
                                                {candidate.nodeIds.length} steps
                                                {exists ? " · already a journey" : ""}
                                                {candidate.end === "cycle" ? " · loops" : ""}
                                            </span>
                                        </label>
                                        <p className="studio-candidate-path studio-mono">
                                            {candidate.nodeIds.join(" → ")}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <footer className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                        <span className="studio-text-faint mr-auto text-[11px]">
                            {picked.size} ticked
                        </span>
                        <button type="button" className="studio-key" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="studio-key"
                            data-active
                            disabled={picked.size === 0}
                            onClick={() =>
                                onCreate(
                                    candidates
                                        .filter((c) => picked.has(c.key))
                                        .map((candidate) => ({
                                            candidate,
                                            title:
                                                (titles[candidate.key] ?? candidate.title).trim() ||
                                                candidate.title,
                                        }))
                                )
                            }
                        >
                            <SparklesIcon />
                            Create {picked.size} {picked.size === 1 ? "journey" : "journeys"}
                        </button>
                    </footer>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default DeriveDialog;
