import { FlowMap, MappedStep } from "@/types/flow-state-type";
import { store } from "@store/index";

export type PairedStep = {
    first: MappedStep;
    second?: MappedStep;
};

// Stable identity for a step across polls — used for INPUT-REQUIRED suppression, change detection,
// and ref/React keys. The `m`/`s` prefix separates a missed step from a sequence step that happens
// to share actionId+index; extra steps carry index === -1 (sequence >= 0) so never collide, and
// differ from each other by actionId.
export function stepSignature(step: MappedStep): string {
    return `${step.missedStep ? "m" : "s"}|${step.actionId}|${step.index}`;
}

// Whether the LAMF launch popup has already been handled this run (survives refresh).
export function isLaunchDone(markerKey: string): boolean {
    return Boolean(store.getState().uiFlags.lamfLaunchDone[markerKey]);
}

// Nearest actually-scrolling ancestor, or null when the window/document is the scroller.
export function getScrollParent(el: HTMLElement): HTMLElement | null {
    let parent = el.parentElement;
    while (parent) {
        const overflowY = getComputedStyle(parent).overflowY;
        if (
            (overflowY === "auto" || overflowY === "scroll") &&
            parent.scrollHeight > parent.clientHeight
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

export function getOrderedSteps(mappedFlow: FlowMap): PairedStep[] {
    const sequence = [...mappedFlow.sequence, ...mappedFlow.missedSteps];
    // Track visited steps by array position, not `actionId_index`: extra steps all carry
    // index === -1, so duplicate actionIds would otherwise collide and get dropped.
    const visited = new Set<number>();
    const steps: PairedStep[] = [];

    for (let i = 0; i < sequence.length; i++) {
        if (visited.has(i)) continue;
        visited.add(i);
        const step = sequence[i];

        let pairStep: MappedStep | undefined;
        if (step.pairActionId) {
            const pairIndex = sequence.findIndex(
                (s, j) => !visited.has(j) && s.actionId === step.pairActionId
            );
            if (pairIndex !== -1) {
                visited.add(pairIndex);
                pairStep = sequence[pairIndex];
            }
        }

        steps.push({
            first: step,
            second: pairStep,
        });
    }

    return steps.sort((a, b) => {
        return a.first.index - b.first.index;
    });
}
