import { useEffect, useRef } from "react";

import { isMac, isModKey, isShortcutBlocked } from "@pages/protocol-studio/ui/editor/shortcuts";

/** What the graph's shortcuts do. Each returns whether it did anything. */
export interface StudioShortcutHandlers {
    /** Off on other stages and while a menu or dialog is open. */
    enabled: boolean;
    /** The selection as clipboard text, or null when nothing is selected. */
    copy: () => string | null;
    /** `copy`, then deletes the selection. */
    cut: () => string | null;
    /** Pastes clipboard text; false when it is not Studio nodes. */
    paste: (text: string) => boolean;
    duplicate: () => boolean;
    undo: () => boolean;
    redo: () => boolean;
    selectAll: () => boolean;
    remove: () => boolean;
    clearSelection: () => boolean;
}

/** The user has text highlighted somewhere: ⌘C copies that, not nodes. */
const hasTextSelection = () => {
    const selection = window.getSelection();
    return selection !== null && !selection.isCollapsed && selection.toString() !== "";
};

/**
 * The canvas's editing shortcuts (⌘ on a Mac, Ctrl elsewhere): C / X / V
 * copy, cut and paste nodes, D duplicates, Z undoes, ⇧Z (and Ctrl+Y) redoes,
 * A selects every node on the level, Delete / Backspace delete, Esc clears
 * the selection. Copy, cut and paste go through the browser's clipboard
 * events, so they work across tabs and from the Edit menu, and need no
 * clipboard permission. Nothing fires while typing (inputs, Monaco, `.nokey`),
 * so text keeps its own copy, paste and undo.
 */
export const useStudioShortcuts = (handlers: StudioShortcutHandlers) => {
    // Read at event time: the listeners are added once.
    const ref = useRef(handlers);
    ref.current = handlers;

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const h = ref.current;
            if (!h.enabled || e.altKey || isShortcutBlocked(e.target)) return;
            // Already handled elsewhere. Not for Esc: the app header's navigation menu keeps a
            // Radix dismissable layer mounted while closed, and it cancels every Esc on the page.
            if (e.defaultPrevented && e.key !== "Escape") return;
            const key = e.key.toLowerCase();
            let done = false;
            if (isModKey(e)) {
                if (key === "z") done = e.shiftKey ? h.redo() : h.undo();
                else if (key === "y" && !isMac && !e.shiftKey) done = h.redo();
                else if (key === "a" && !e.shiftKey) done = h.selectAll();
                else if (key === "d" && !e.shiftKey) {
                    h.duplicate();
                    // Never the browser's bookmark dialog, even with nothing to duplicate.
                    done = true;
                }
            } else if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                if (e.key === "Delete" || e.key === "Backspace") done = h.remove();
                else if (e.key === "Escape") done = h.clearSelection();
            }
            if (done) e.preventDefault();
        };

        const onCopyOrCut = (e: ClipboardEvent) => {
            const h = ref.current;
            if (!h.enabled || !e.clipboardData || isShortcutBlocked(e.target)) return;
            if (hasTextSelection()) return;
            const text = e.type === "cut" ? h.cut() : h.copy();
            if (text === null) return;
            e.clipboardData.setData("text/plain", text);
            e.preventDefault();
        };

        const onPaste = (e: ClipboardEvent) => {
            const h = ref.current;
            if (!h.enabled || !e.clipboardData || isShortcutBlocked(e.target)) return;
            if (h.paste(e.clipboardData.getData("text/plain"))) e.preventDefault();
        };

        window.addEventListener("keydown", onKeyDown);
        document.addEventListener("copy", onCopyOrCut);
        document.addEventListener("cut", onCopyOrCut);
        document.addEventListener("paste", onPaste);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("copy", onCopyOrCut);
            document.removeEventListener("cut", onCopyOrCut);
            document.removeEventListener("paste", onPaste);
        };
    }, []);
};

export default useStudioShortcuts;
