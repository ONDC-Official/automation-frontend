import { useEffect, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { SignalIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type { StudioJourney } from "@pages/protocol-studio/ui/editor/types";

export interface IStartLiveSubmit {
    subscriberUrl: string;
    role: "BAP" | "BPP";
    journeyIds: string[];
}

export interface IStartLiveDialogProps {
    open: boolean;
    journeys: StudioJourney[];
    /** Per journey, why it can't go live (null when it can). */
    blockers: Map<string, string | null>;
    /** Why no live session can start (graph not compiled …), or null. */
    blocked: string | null;
    container: HTMLElement | null;
    onClose: () => void;
    /** Resolves to an error to show, or null once the session is open. */
    onStart: (data: IStartLiveSubmit) => Promise<string | null>;
}

const URL_PATTERN = /^(http|https):\/\/[^ "]+$/;

/**
 * Promotes the graph to a live session against a real network participant:
 * its subscriber URL, the role it plays (the mock plays the other side), and
 * the journeys to run — each becomes one flow on the live page. `testing` as
 * the URL opens two sessions where the mock plays both sides against itself,
 * as v1 does.
 */
export const StartLiveDialog = ({
    open,
    journeys,
    blockers,
    blocked,
    container,
    onClose,
    onStart,
}: IStartLiveDialogProps) => {
    const runnable = useMemo(
        () => journeys.filter((j) => !blockers.get(j.id)).map((j) => j.id),
        [journeys, blockers]
    );
    const [subscriberUrl, setSubscriberUrl] = useState("");
    const [role, setRole] = useState<"BAP" | "BPP">("BAP");
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Every runnable journey is ticked each time the dialog opens.
    useEffect(() => {
        if (!open) return;
        setPicked(new Set(runnable));
        setError(null);
    }, [open, runnable]);

    const toggle = (id: string) =>
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const url = subscriberUrl.trim();
    const urlOk = url === "testing" || URL_PATTERN.test(url);
    const problem = blocked
        ? blocked
        : journeys.length === 0
          ? "Add a journey first: each journey becomes one live flow"
          : picked.size === 0
            ? "Tick at least one journey"
            : !urlOk
              ? "Enter your subscriber URL (http:// or https://), or `testing`"
              : null;

    const submit = async () => {
        if (problem) return;
        setBusy(true);
        setError(null);
        try {
            const ordered = journeys.filter((j) => picked.has(j.id)).map((j) => j.id);
            const failure = await onStart({ subscriberUrl: url, role, journeyIds: ordered });
            if (failure) setError(failure);
            else onClose();
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;
    return (
        <DialogPrimitive.Root open onOpenChange={(next) => !next && onClose()}>
            <DialogPrimitive.Portal container={container}>
                <DialogPrimitive.Overlay className="studio-dialog-overlay" />
                <DialogPrimitive.Content className="studio-glass studio-form-dialog nokey">
                    <header className="flex items-center gap-3 px-4 pt-3 pb-2">
                        <SignalIcon className="studio-code-dialog-icon" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="studio-code-dialog-title">
                                Start live session
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="studio-text-dim truncate text-[12px]">
                                Run the journeys against your network participant. The mock plays
                                the other side.
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            className="studio-key studio-key-icon"
                            aria-label="Close"
                            title="Close"
                        >
                            <XMarkIcon />
                        </DialogPrimitive.Close>
                    </header>

                    <div className="studio-form-dialog-body">
                        <div className="bp-props-section">
                            <p className="studio-eyebrow">Your participant</p>
                            <div className="bp-field" data-wide>
                                <label className="bp-field-label" htmlFor="live-subscriber-url">
                                    subscriber url · required
                                </label>
                                <input
                                    id="live-subscriber-url"
                                    className="bp-input"
                                    value={subscriberUrl}
                                    placeholder="https://example.com/subscriber · or testing"
                                    autoFocus
                                    onChange={(e) => setSubscriberUrl(e.target.value)}
                                />
                            </div>
                            <div className="bp-field" data-wide>
                                <span className="bp-field-label">your role</span>
                                <div className="flex gap-1.5" role="radiogroup">
                                    {(["BAP", "BPP"] as const).map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            role="radio"
                                            aria-checked={role === value}
                                            className="studio-key studio-key-sm"
                                            data-active={role === value || undefined}
                                            disabled={url === "testing"}
                                            onClick={() => setRole(value)}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                    <span className="studio-text-faint self-center text-[11.5px]">
                                        {url === "testing"
                                            ? "testing: the mock plays both sides, two sessions"
                                            : `the mock plays ${role === "BAP" ? "BPP" : "BAP"}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bp-props-section min-h-0">
                            <p className="studio-eyebrow">
                                Journeys · {picked.size} of {journeys.length} ticked
                            </p>
                            {journeys.length === 0 ? (
                                <p className="studio-text-faint text-[12px]">
                                    No journeys yet. Add one on the Journeys stage.
                                </p>
                            ) : (
                                <ul className="studio-well studio-picklist">
                                    {journeys.map((journey) => {
                                        const blocker = blockers.get(journey.id) ?? null;
                                        return (
                                            <li key={journey.id}>
                                                <label
                                                    className="studio-pick"
                                                    title={blocker ?? undefined}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        data-journey-id={journey.id}
                                                        checked={picked.has(journey.id)}
                                                        disabled={!!blocker}
                                                        onChange={() => toggle(journey.id)}
                                                    />
                                                    <span className="truncate">
                                                        {journey.title || journey.id}
                                                    </span>
                                                    <span className="studio-text-faint ml-auto truncate text-[11px]">
                                                        {blocker ?? journey.id}
                                                    </span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        {error ? (
                            <p className="text-[12px] text-red-500" role="alert">
                                {error}
                            </p>
                        ) : null}
                    </div>

                    <footer className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                        {problem ? (
                            <span className="studio-text-faint mr-auto truncate text-[11.5px]">
                                {problem}
                            </span>
                        ) : null}
                        <button type="button" className="studio-key" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="studio-key"
                            data-active
                            data-action="start-live"
                            disabled={!!problem || busy}
                            title={problem ?? undefined}
                            onClick={() => void submit()}
                        >
                            <SignalIcon />
                            {busy ? "Starting…" : "Start session"}
                        </button>
                    </footer>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default StartLiveDialog;
