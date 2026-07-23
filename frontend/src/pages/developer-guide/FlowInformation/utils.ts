import type {
    FlowStep,
    StepDisplayItem,
    FlowDetailBlock,
    FlowEntry,
} from "@pages/developer-guide/types";
import { getActionId } from "@pages/developer-guide/utils";
import type {
    FlowExample,
    FlowInformationSection,
} from "@pages/developer-guide/FlowInformation/types";

/** Pairs up request/response steps (e.g. search + on_search) for display; unpaired steps stand alone. */
export function buildStepDisplayItems(steps: FlowStep[]): StepDisplayItem[] {
    const displayed = new Set<number>();
    const items: StepDisplayItem[] = [];
    const actionIdToIdx = new Map<string, number>();

    steps?.forEach((s, i) => {
        const aid = getActionId(s);
        actionIdToIdx.set(aid, i);
    });

    for (let i = 0; i < steps?.length; i++) {
        if (displayed.has(i)) continue;
        const step = steps[i];
        const responseFor = step.responseFor;

        if (responseFor) {
            const requestIdx = actionIdToIdx.get(responseFor);
            if (requestIdx != null && !displayed.has(requestIdx)) {
                items.push({
                    type: "pair",
                    request: steps[requestIdx],
                    response: step,
                    requestIdx,
                    responseIdx: i,
                });
                displayed.add(requestIdx);
                displayed.add(i);
                continue;
            }
        }

        const actionId = getActionId(step);
        const responderIdx = steps.findIndex((s) => s.responseFor === actionId);
        if (responderIdx >= 0 && !displayed.has(responderIdx)) {
            items.push({
                type: "pair",
                request: step,
                response: steps[responderIdx],
                requestIdx: i,
                responseIdx: responderIdx,
            });
            displayed.add(i);
            displayed.add(responderIdx);
        } else {
            items.push({ type: "single", step, stepIdx: i });
            displayed.add(i);
        }
    }
    return items;
}

export function getExamplesFromStep(step: FlowStep | undefined): FlowExample[] {
    if (!step) return [];
    const fromStep = step.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromStep && fromStep.length > 0) return fromStep;
    const fromMock = step.mock?.examples?.map((ex) => ({
        name: ex.name ?? ex.description ?? "Example",
        payload: ex.payload,
    }));
    if (fromMock && fromMock.length > 0) return fromMock;
    if (step.example?.value != null)
        return [
            {
                name: (step.example as { summary?: string }).summary ?? "Example",
                payload: step.example.value,
            },
        ];
    if (step.mock?.defaultPayload != null)
        return [{ name: "Default", payload: step.mock.defaultPayload }];
    return [];
}

/** Default Details tab for a newly-selected action. */
export function resolveDefaultSection(): FlowInformationSection {
    return "sequence";
}

function collectMermaidBlocks(details: FlowDetailBlock[] | undefined): string[] {
    if (!details?.length) return [];
    return details
        .map((d) => d.mermaid?.trim())
        .filter((m): m is string => !!m && m.includes("sequenceDiagram"));
}

function normalizeMermaid(source: string): string {
    const trimmed = source.trim();
    return trimmed.startsWith("sequenceDiagram") ? trimmed : `sequenceDiagram\n${trimmed}`;
}

function joinMermaidBlocks(blocks: string[]): string | null {
    if (blocks.length === 0) return null;
    // Mermaid allows only one diagram root — keep the first authored block.
    return normalizeMermaid(blocks[0]);
}

/**
 * Resolve authored Mermaid for the Details "Sequence Diagram" tab.
 * Only returns diagrams supplied by the spec (`details[].mermaid`); no client-side fallback.
 */
export function resolveSequenceMermaid(
    flow: FlowEntry | undefined,
    step: FlowStep | undefined
): string | null {
    if (!flow) return null;

    const fromStep = joinMermaidBlocks(collectMermaidBlocks(step?.details));
    if (fromStep) return fromStep;

    return joinMermaidBlocks(collectMermaidBlocks(flow.config?.details));
}
