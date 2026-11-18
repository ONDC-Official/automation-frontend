import type { XYPosition } from "@xyflow/react";

import type { FlowEntry, FlowStep } from "@/types/apiShared/developerGuide/developerGuide.types";
import {
    decodeSource,
    getTemplateFiles,
} from "@pages/protocol-studio/ui/editor/flows/action-files";
import {
    getUniqueNodeId,
    makeEdgeId,
    NODE_KINDS,
} from "@pages/protocol-studio/ui/editor/graph/catalog";
import { BP } from "@pages/protocol-studio/ui/editor/graph/layout";
import type {
    ActionFiles,
    NodeKind,
    PublishedFlow,
    StudioEdge,
    StudioGraph,
    StudioNode,
} from "@pages/protocol-studio/ui/editor/types";

/** Takes a published entry, so flows can be matched by key. */
export const getPublishedFlowKey = ({ usecase, flowId }: Pick<FlowEntry, "usecase" | "flowId">) =>
    `${usecase}::${flowId}`;

/** `flowName` from the flow's own meta, else its id with underscores as spaces. */
const getPublishedFlowTitle = (entry: FlowEntry) => {
    const flowName = (entry.config.meta as { flowName?: unknown } | undefined)?.flowName;
    return typeof flowName === "string" && flowName.trim() !== ""
        ? flowName
        : entry.flowId.replace(/_/g, " ");
};

export const toPublishedFlow = (entry: FlowEntry): PublishedFlow => ({
    key: getPublishedFlowKey(entry),
    title: getPublishedFlowTitle(entry),
    entry,
});

const toJsonSource = (value: unknown, fallback: string) =>
    value === undefined ? fallback : `${JSON.stringify(value, null, 2)}\n`;

const getStepKind = (step: FlowStep): NodeKind => {
    if (/form/i.test(step.api)) return "form";
    if (step.unsolicited) return "unsolicited";
    if (step.responseFor) return "callback";
    return "request";
};

const getStepFiles = (step: FlowStep, templates: ActionFiles): ActionFiles => ({
    generate: decodeSource(step.mock?.generate, templates.generate),
    validate: decodeSource(step.mock?.validate, templates.validate),
    // v1 steps have no recogniser: none, rather than a template that accepts everything.
    match: "",
    // Nor an exit condition: a v1 step runs once each time it is reached.
    exit: "",
    requirements: decodeSource(step.mock?.requirements, templates.requirements),
    defaultPayload: toJsonSource(step.mock?.defaultPayload, templates.defaultPayload),
    inputs: toJsonSource(step.mock?.inputs, templates.inputs),
});

/** The step's `saveData` map as published, and a form step's HTML, decoded. */
const getStepSessionFields = (step: FlowStep): Pick<StudioNode, "saveData" | "formHtml"> => {
    const saveData = step.mock?.saveData;
    const formHtml = step.mock?.formHtml;
    return {
        ...(saveData && typeof saveData === "object"
            ? { saveData: { ...(saveData as Record<string, string>) } }
            : {}),
        ...(typeof formHtml === "string" && formHtml !== ""
            ? { formHtml: decodeSource(formHtml, "") }
            : {}),
    };
};

/** Requests on the top row, everything answering them dropped a little: a zigzag. */
const CALLBACK_DROP = 64;

/**
 * A published flow as graph nodes, its first step's top-left at `origin`:
 * one node per step, wired in step order (a request → its own callback as a
 * `response` edge). Ids are the steps' action ids, made unique against `taken`.
 */
export const toGraphFragment = (
    published: PublishedFlow,
    origin: XYPosition,
    taken: ReadonlySet<string>
): StudioGraph => {
    // Published steps are JavaScript; a step missing a file gets the JS template.
    const templates = getTemplateFiles(undefined, "javascript");
    const steps = published.entry.config.steps ?? [];
    const used = new Set(taken);
    /** Step action id → node id, so `responseFor` survives renaming. */
    const idOf = new Map<string, string>();
    const nodes: StudioNode[] = [];
    const edges: StudioEdge[] = [];

    steps.forEach((step, index) => {
        const actionId = step.action_id ?? step.api;
        const id = getUniqueNodeId(actionId, used);
        used.add(id);
        if (!idOf.has(actionId)) idOf.set(actionId, id);

        const kind = getStepKind(step);
        const owner =
            step.owner === "BAP" || step.owner === "BPP" ? step.owner : NODE_KINDS[kind].owner;
        nodes.push({
            id,
            api: step.api,
            owner,
            kind,
            responseFor: step.responseFor ? (idOf.get(step.responseFor) ?? null) : null,
            usecases: [published.entry.usecase],
            description: step.description ?? "",
            files: getStepFiles(step, templates),
            ...getStepSessionFields(step),
            // Their code is v1's: JavaScript reading the session as stored.
            codeLanguage: "javascript",
            sessionView: "raw",
            position: {
                x: origin.x + index * (BP.width + BP.gap / 2),
                y: origin.y + (kind === "request" ? 0 : CALLBACK_DROP),
            },
        });

        const prev = nodes[index - 1];
        if (prev) {
            const isPair = nodes[index].responseFor === prev.id;
            edges.push({
                id: makeEdgeId(),
                from: prev.id,
                to: id,
                kind: isPair ? "response" : "next",
                mandated: true,
            });
        }
    });

    return { nodes, edges };
};
