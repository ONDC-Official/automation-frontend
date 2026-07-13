export function getRevealTargets(root: HTMLElement): HTMLElement[] {
    const direct = [...root.children] as HTMLElement[];

    // Single page root → animate its section children instead of one blob
    if (direct.length === 1 && direct[0].children.length > 0) {
        return [...direct[0].children] as HTMLElement[];
    }

    return direct;
}

export function isInView(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.top < vh * 0.92 && rect.bottom > 0;
}

export function revealElement(el: HTMLElement) {
    // Force a reflow so the CSS animation restarts on every navigation
    el.classList.remove("is-revealed");
    void el.offsetWidth;
    el.classList.add("is-revealed");
}
