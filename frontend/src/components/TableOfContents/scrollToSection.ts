/** Walks up from `el` to find the element that actually scrolls it (or null if it's the window). */
function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
    let node = el.parentElement;
    while (node) {
        const { overflowY } = getComputedStyle(node);
        if (
            (overflowY === "auto" || overflowY === "scroll") &&
            node.scrollHeight > node.clientHeight
        ) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

/**
 * Scrolls just enough to reveal a section beneath any sticky header/breadcrumb,
 * rather than forcing it to the very top of the viewport (which is what
 * `scrollIntoView({ block: "start" })` does, and what causes sticky headers to
 * jump/overlap the target).
 *
 * Targets whichever element actually scrolls the section into view — an
 * internal `overflow-y: auto` content pane if one exists in the ancestor
 * chain, otherwise the window — instead of assuming the document scrolls.
 *
 * No-ops when the section is already comfortably visible, so repeated or
 * already-in-view navigation doesn't cause a jump at all.
 */
export function scrollToSectionWithOffset(id: string, offset: number, comfortGap = 16): void {
    const el = document.getElementById(id);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const hiddenBehindStickyHeader = rect.top < offset + comfortGap;
    const belowViewport = rect.top > window.innerHeight - comfortGap;
    if (!hiddenBehindStickyHeader && !belowViewport) return;

    const delta = rect.top - offset - comfortGap;
    const scrollContainer = findScrollableAncestor(el);
    if (scrollContainer) {
        scrollContainer.scrollBy({ top: delta, behavior: "smooth" });
    } else {
        window.scrollBy({ top: delta, behavior: "smooth" });
    }
}
