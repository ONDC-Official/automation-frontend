/** Apple keyboards use ⌘ where everyone else uses Ctrl. */
export const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/** The platform's modifier is held: ⌘ on a Mac, Ctrl elsewhere. */
export const isModKey = (e: { metaKey: boolean; ctrlKey: boolean }) =>
    isMac ? e.metaKey : e.ctrlKey;

/** A shortcut as the platform writes it: `⌘C` on a Mac, `Ctrl+C` elsewhere. */
export const formatShortcut = (key: string, { shift = false } = {}) =>
    isMac ? `${shift ? "⇧" : ""}⌘${key}` : `Ctrl+${shift ? "Shift+" : ""}${key}`;

/** Typing in these never triggers the graph's keyboard shortcuts. */
export const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.closest(".monaco-editor") !== null);

/**
 * The graph's shortcuts leave these alone: anywhere one types, and anything
 * marked `nokey` (React Flow's own opt-out, used by Monaco's wrapper and the
 * run dialog).
 */
export const isShortcutBlocked = (target: EventTarget | null) =>
    isTypingTarget(target) || (target instanceof Element && target.closest(".nokey") !== null);
