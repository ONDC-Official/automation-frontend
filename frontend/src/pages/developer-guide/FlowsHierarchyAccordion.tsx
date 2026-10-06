import React, { FC, Fragment, useEffect, useMemo, useState } from "react";
import {
    ArrowTurnDownRightIcon,
    ArrowsRightLeftIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { Switch } from "@/components/Shadcn/Switch/switch";
import { cn } from "@/lib/utils";
import type { FlowEntry, FlowStep, StepDisplayItem } from "./types";
import { getActionId } from "./utils";
import OwnerPill from "./shared/components/OwnerPill";
import {
    buildFlowHierarchies,
    type FlowHierarchyGroup,
} from "./FlowInformation/flowHierarchyPreview";
import {
    annotateSimplifiedItems,
    getSimplifiedGroups,
    getInlineFlowConfigs,
    getPreferredJourneyFlowId,
    type SimplifiedItemAnnotation,
} from "./FlowInformation/simplifiedFlowView";

interface FlowsHierarchyAccordionProps {
    flows: FlowEntry[];
    selectedFlow?: string;
    selectedFlowAction?: string;
    setSelectedFlow: (flow: string) => void;
    setSelectedFlowAction: (action: string) => void;
}

const flowTitle = (flowId: string) => flowId.split("_").join(" ");

const FlowsHierarchyAccordion: FC<FlowsHierarchyAccordionProps> = ({
    flows,
    selectedFlow,
    selectedFlowAction,
    setSelectedFlow,
    setSelectedFlowAction,
}) => {
    const groups: FlowHierarchyGroup[] = useMemo(() => buildFlowHierarchies(flows), [flows]);

    // "API Reference" toggle: off (default) shows the simplified, user-friendly
    // names for the main-path steps covered by a simplified-view config; on shows
    // the existing API-call UI. The toggle only renders when a config matches
    // these flows (e.g. FIS12 Personal Loan) — other use cases are unaffected.
    const [showApiReference, setShowApiReference] = useState(false);

    const simplifiedAnnotations = useMemo(() => {
        const map = new Map<string, SimplifiedItemAnnotation[]>();
        for (const group of groups) {
            if (!group.isExplicitPrimary) continue;
            const configGroups = getSimplifiedGroups(group.primary);
            if (!configGroups) continue;
            const annotations = annotateSimplifiedItems(group.primaryItems, configGroups);
            if (annotations) map.set(group.primary.flowId, annotations);
        }
        return map;
    }, [groups]);
    const hasSimplifiedView = simplifiedAnnotations.size > 0;

    // The representative group used for the Journey View (toggle off).
    // Prefer the flowId specified in the config (e.g. Personal_Loan_Single_Redirection)
    // so the Full Journey card always shows the correct variant rather than
    // whichever primary happens to appear first in the groups array.
    const journeyGroup = useMemo(() => {
        // First try the config-preferred flowId.
        const preferred = groups.find((g) => {
            if (!simplifiedAnnotations.has(g.primary.flowId)) return false;
            const preferredId = getPreferredJourneyFlowId(g.primary);
            return preferredId ? g.primary.flowId === preferredId : false;
        });
        if (preferred) return preferred;
        // Fall back to first annotated primary.
        return groups.find((g) => simplifiedAnnotations.has(g.primary.flowId)) ?? null;
    }, [groups, simplifiedAnnotations]);

    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [openSecondaryId, setOpenSecondaryId] = useState<string | null>(null);
    const [openPrereqId, setOpenPrereqId] = useState<string | null>(null);
    const [openJourneySecondaryId, setOpenJourneySecondaryId] = useState<string | null>(null);
    const [openInlineFlowId, setOpenInlineFlowId] = useState<string | null>(null);

    // Inline flows to inject inside the journey view (config-driven).
    const inlineFlowConfigs = useMemo(
        () => (journeyGroup ? getInlineFlowConfigs(journeyGroup.primary) : []),
        [journeyGroup]
    );

    // Map: primaryItems index → flowIds to inject after that item.
    // We find the last item whose annotation belongs to the target heading.
    const inlineInjectionPoints = useMemo<Map<number, string[]>>(() => {
        if (!journeyGroup || inlineFlowConfigs.length === 0) return new Map();
        const anns = simplifiedAnnotations.get(journeyGroup.primary.flowId);
        if (!anns) return new Map();

        // For each heading, track the last item index that belongs to it.
        const lastIndexOfHeading: Record<string, number> = {};
        let currentHeading: string | undefined;
        for (let i = 0; i < anns.length; i++) {
            if (anns[i].heading) currentHeading = anns[i].heading;
            if (currentHeading !== undefined) lastIndexOfHeading[currentHeading] = i;
        }

        const map = new Map<number, string[]>();
        for (const cfg of inlineFlowConfigs) {
            const targetIdx = lastIndexOfHeading[cfg.afterHeading];
            if (targetIdx !== undefined) {
                map.set(targetIdx, [...(map.get(targetIdx) ?? []), cfg.flowId]);
            }
        }
        return map;
    }, [journeyGroup, inlineFlowConfigs, simplifiedAnnotations]);

    // Keep the group (and secondary) owning the externally-selected flow expanded.
    useEffect(() => {
        if (!selectedFlow) return;
        for (const group of groups) {
            if (group.primary.flowId === selectedFlow) {
                setOpenGroupId(group.primary.flowId);
                return;
            }
            const secondary = group.secondaries.find((s) => s.flow.flowId === selectedFlow);
            if (secondary) {
                setOpenGroupId(group.primary.flowId);
                setOpenSecondaryId(secondary.flow.flowId);
                return;
            }
            // Prerequisites render inside every primary card; open this one to reveal it.
            if (group.prerequisites.some((p) => p.flow.flowId === selectedFlow)) {
                setOpenGroupId(group.primary.flowId);
                setOpenPrereqId(selectedFlow);
                return;
            }
        }
    }, [groups, selectedFlow]);

    if (groups.length === 0) return null;

    const selectStep = (flowId: string, step: FlowStep) => {
        setSelectedFlow(flowId);
        setSelectedFlowAction(getActionId(step));
    };

    // Same sizing/padding as FlowsAccordion's renderStepButton.
    const stepButton = (flowId: string, step: FlowStep) => {
        const actionId = getActionId(step);
        const isSelected = selectedFlow === flowId && selectedFlowAction === actionId;
        return (
            <Button
                key={actionId}
                type="button"
                variant="ghost"
                onClick={() => selectStep(flowId, step)}
                className={cn(
                    "h-auto w-full min-w-0 flex-col items-stretch px-2 py-2 rounded-lg border font-normal text-left transition-[border-color,box-shadow] duration-200",
                    isSelected
                        ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                        : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                )}
            >
                <div className="flex w-full min-w-0 items-center justify-between gap-1">
                    <span className="min-w-0 text-[11px] font-medium leading-tight text-slate-800 dark:text-n-10 whitespace-nowrap">
                        {step.action_label ?? step.api}
                    </span>
                    <OwnerPill
                        owner={step.owner}
                        className="shrink-0 px-1 py-px text-[8px] leading-none"
                    />
                </div>
            </Button>
        );
    };

    // Vertical stepper rail (same as FlowsAccordion): dot per row, segments filled up
    // to the currently-selected call.
    const stepperBullet = (
        isReached: boolean,
        isPast: boolean,
        isFirst: boolean,
        isLast: boolean
    ) => (
        <div
            className="relative flex w-4 shrink-0 items-center justify-center self-stretch"
            aria-hidden
        >
            {!isFirst && (
                <span
                    className={cn(
                        "absolute -top-2.5 bottom-1/2 left-1/2 w-px -translate-x-1/2",
                        isReached ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                />
            )}
            {!isLast && (
                <span
                    className={cn(
                        "absolute top-1/2 -bottom-2.5 left-1/2 w-px -translate-x-1/2",
                        isPast ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                />
            )}
            <span
                className={cn(
                    "relative z-10 size-2.5 shrink-0 rounded-full border-2",
                    isReached
                        ? "border-sky-500 bg-sky-500"
                        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-surface-elevated"
                )}
            />
        </div>
    );

    const itemMatchesAction = (item: StepDisplayItem, actionId: string | undefined) => {
        if (!actionId) return false;
        if (item.type === "pair") {
            return (
                getActionId(item.request) === actionId || getActionId(item.response) === actionId
            );
        }
        return getActionId(item.step) === actionId;
    };

    // User-friendly rows shown in place of the API-call buttons while the
    // "API Reference" toggle is off. Same selection behavior as stepButton — the
    // rows only swap the label, so clicking still opens the API call details.
    const simplifiedStepRows = (
        flowId: string,
        item: StepDisplayItem,
        labels: Record<string, string>
    ) => {
        const steps = item.type === "pair" ? [item.request, item.response] : [item.step];
        return (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {steps.map((step) => {
                    const actionId = getActionId(step);
                    const isSelected = selectedFlow === flowId && selectedFlowAction === actionId;
                    return (
                        <Button
                            key={actionId}
                            type="button"
                            variant="ghost"
                            onClick={() => selectStep(flowId, step)}
                            className={cn(
                                "h-auto w-full min-w-0 justify-start px-2 py-2 rounded-lg border font-normal text-left transition-[border-color,box-shadow] duration-200",
                                isSelected
                                    ? "border-sky-400 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/20 bg-white dark:bg-surface-elevated shadow-sm"
                                    : "border-slate-200 bg-white dark:bg-surface-elevated hover:border-slate-300 hover:shadow-xs"
                            )}
                        >
                            <span className="min-w-0 text-[11px] font-medium leading-tight text-slate-800 dark:text-n-10 whitespace-normal text-left">
                                {labels[step.api] ?? step.action_label ?? step.api}
                            </span>
                        </Button>
                    );
                })}
            </div>
        );
    };

    const stepRows = (
        flowId: string,
        items: StepDisplayItem[],
        withStepper = false,
        annotations?: SimplifiedItemAnnotation[] | null,
        injectAfter?: Map<number, React.ReactNode>
    ) => {
        const selectedItemIndex =
            withStepper && selectedFlow === flowId
                ? items.findIndex((item) => itemMatchesAction(item, selectedFlowAction))
                : -1;
        return (
            <div className="flex flex-col gap-2.5 pt-2.5">
                {items.map((item, i) => {
                    const annotation = annotations?.[i];
                    const simplifiedLabels =
                        !showApiReference && annotation?.stepLabels ? annotation.stepLabels : null;
                    return (
                        <Fragment key={i}>
                            {annotation?.heading && (
                                <div
                                    className={cn(
                                        "text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-n-40",
                                        i > 0 && "pt-1"
                                    )}
                                >
                                    {annotation.heading}
                                </div>
                            )}
                            <div className="flex min-w-0 items-center gap-2.5">
                                {withStepper &&
                                    stepperBullet(
                                        selectedItemIndex >= 0 && i <= selectedItemIndex,
                                        selectedItemIndex >= 0 && i < selectedItemIndex,
                                        i === 0,
                                        i === items.length - 1
                                    )}
                                {simplifiedLabels ? (
                                    simplifiedStepRows(flowId, item, simplifiedLabels)
                                ) : item.type === "pair" ? (
                                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)] items-center gap-x-2.5">
                                        {stepButton(flowId, item.request)}
                                        <span className="flex items-center justify-center">
                                            <ArrowsRightLeftIcon
                                                className="size-3 shrink-0 text-slate-400"
                                                aria-hidden
                                            />
                                        </span>
                                        {stepButton(flowId, item.response)}
                                    </div>
                                ) : (
                                    <div className="min-w-0 flex-1">
                                        {stepButton(flowId, item.step)}
                                    </div>
                                )}
                            </div>
                            {injectAfter?.get(i)}
                        </Fragment>
                    );
                })}
            </div>
        );
    };

    // Shared toggle bar rendered at the top of both views.
    const toggleBar = hasSimplifiedView && (
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-white px-1 py-2 dark:bg-surface-page">
            <Switch
                id="dev-guide-api-reference"
                size="sm"
                checked={showApiReference}
                onCheckedChange={setShowApiReference}
            />
            <label
                htmlFor="dev-guide-api-reference"
                className="cursor-pointer text-[12px] font-medium text-slate-700 dark:text-n-20"
            >
                API Reference
            </label>
        </div>
    );

    // ── Journey View: toggle OFF + simplified config exists ──────────────────
    if (!showApiReference && hasSimplifiedView && journeyGroup) {
        const flowId = journeyGroup.primary.flowId;
        const annotations = simplifiedAnnotations.get(flowId) ?? null;

        // Filter main journey to only items covered by a simplified group
        // (removes uncovered steps, e.g. status/on_status that have no group in simplified config).
        const coveredItems: StepDisplayItem[] = [];
        const coveredAnnotations: SimplifiedItemAnnotation[] = [];
        (annotations ?? []).forEach((ann, i) => {
            if (ann.stepLabels && Object.keys(ann.stepLabels).length > 0) {
                coveredItems.push(journeyGroup.primaryItems[i]);
                coveredAnnotations.push(ann);
            }
        });
        const journeyItems = coveredItems.length > 0 ? coveredItems : journeyGroup.primaryItems;
        const journeyAnnotations = coveredItems.length > 0 ? coveredAnnotations : annotations;

        // Build inline-injection node map. Injection indices are remapped to the
        // filtered coveredItems array (find the last covered item whose heading matches).
        const injectNodes: Map<number, React.ReactNode> | undefined =
            inlineInjectionPoints.size > 0
                ? (() => {
                      // Recompute injection index against the filtered journeyItems + journeyAnnotations.
                      const lastIndexOfHeading: Record<string, number> = {};
                      let currentHeading: string | undefined;
                      journeyAnnotations?.forEach((ann, i) => {
                          if (ann.heading) currentHeading = ann.heading;
                          if (currentHeading !== undefined) lastIndexOfHeading[currentHeading] = i;
                      });

                      const nodeMap = new Map<number, React.ReactNode>();
                      for (const [, flowIds] of inlineInjectionPoints.entries()) {
                          for (const inlineFlowId of flowIds) {
                              const cfg = inlineFlowConfigs.find((c) => c.flowId === inlineFlowId);
                              const targetIdx = cfg
                                  ? lastIndexOfHeading[cfg.afterHeading]
                                  : undefined;
                              if (targetIdx === undefined) continue;

                              const inlineGroup = groups.find(
                                  (g) => g.primary.flowId === inlineFlowId
                              );
                              if (!inlineGroup) continue;

                              const inlineAnns = simplifiedAnnotations.get(inlineFlowId);
                              const skipHeadings = cfg?.skipHeadings ?? [];

                              // Filter inline items by skipHeadings
                              const filteredItems: StepDisplayItem[] = [];
                              const filteredAnns: SimplifiedItemAnnotation[] = [];
                              let inlineCurrentHeading: string | undefined;
                              inlineGroup.primaryItems.forEach((item, i) => {
                                  const ann = inlineAnns?.[i];
                                  if (ann?.heading) inlineCurrentHeading = ann.heading;
                                  if (
                                      inlineCurrentHeading &&
                                      skipHeadings.includes(inlineCurrentHeading)
                                  )
                                      return;
                                  filteredItems.push(item);
                                  filteredAnns.push(ann ?? {});
                              });

                              const isOpen = openInlineFlowId === inlineFlowId;
                              const node = (
                                  <div key={inlineFlowId} className="space-y-1.5 mt-2">
                                      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-surface-elevated overflow-hidden">
                                          <Button
                                              type="button"
                                              variant="ghost"
                                              onClick={() =>
                                                  setOpenInlineFlowId(isOpen ? null : inlineFlowId)
                                              }
                                              aria-expanded={isOpen}
                                              className="h-auto w-full justify-between gap-2 rounded-none px-3 py-2.5 font-normal text-left hover:bg-violet-50/60 dark:hover:bg-violet-950/20"
                                          >
                                              <span className="flex min-w-0 flex-col items-start gap-1">
                                                  <span className="min-w-0 text-[11px] font-medium text-slate-800 dark:text-n-10 wrap-anywhere whitespace-normal leading-4">
                                                      {cfg?.displayName ??
                                                          inlineFlowId.split("_").join(" ")}
                                                  </span>
                                                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                                                      Optional Step
                                                  </span>
                                              </span>
                                              <span className="flex shrink-0 items-center gap-1.5">
                                                  <ChevronDownIcon
                                                      className={cn(
                                                          "size-3.5 text-slate-400 transition-transform duration-300",
                                                          isOpen && "rotate-180"
                                                      )}
                                                  />
                                              </span>
                                          </Button>
                                          <div
                                              className={cn(
                                                  "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                                                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                              )}
                                          >
                                              <div className="overflow-hidden">
                                                  <div className="px-3 pb-3 pt-0.5">
                                                      {stepRows(
                                                          inlineFlowId,
                                                          filteredItems,
                                                          false,
                                                          filteredAnns.length > 0
                                                              ? filteredAnns
                                                              : null
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              );
                              const existing = nodeMap.get(targetIdx);
                              nodeMap.set(
                                  targetIdx,
                                  existing ? (
                                      <>
                                          {existing}
                                          {node}
                                      </>
                                  ) : (
                                      node
                                  )
                              );
                          }
                      }
                      return nodeMap.size > 0 ? nodeMap : undefined;
                  })()
                : undefined;
        // Derive a short display label for secondary flows by stripping the
        // usecase prefix (e.g. "Personal Loan ") and variant suffixes (e.g. " Offline")
        // so "Personal Loan Foreclosure Offline" → "Foreclosure".
        const usecaseName = journeyGroup.primary.usecase ?? "";
        const VARIANT_SUFFIXES = [" Offline", " Single Redirection", " Online"];
        const shortSecondaryName = (flow: FlowEntry): string => {
            let name = flow.flowId.split("_").join(" ");
            // Strip leading usecase prefix
            if (usecaseName && name.toLowerCase().startsWith(usecaseName.toLowerCase() + " ")) {
                name = name.slice(usecaseName.length + 1);
            }
            // Strip trailing variant suffix
            for (const suffix of VARIANT_SUFFIXES) {
                if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
                    name = name.slice(0, -suffix.length);
                    break;
                }
            }
            return name.trim() || flow.flowId.split("_").join(" ");
        };
        return (
            <div className="space-y-3">
                {toggleBar}
                {/* Single flat journey — steps from the representative primary flow */}
                <div className="rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-n-40 mb-1">
                            Full Journey
                        </p>
                        <p className="text-body-2 font-semibold text-gray-900 dark:text-n-10 leading-5">
                            {journeyGroup.primary.usecase ?? flowId.split("_").join(" ")}
                        </p>
                    </div>
                    <div className="px-4 pb-4">
                        {stepRows(flowId, journeyItems, true, journeyAnnotations, injectNodes)}
                    </div>

                    {/* Alternate paths inside the same card, below the main steps */}
                    {journeyGroup.secondaries.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-border-default px-4 pb-3">
                            <p className="pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-n-40">
                                Servicing Flows
                            </p>
                            <div className="space-y-1.5">
                                {journeyGroup.secondaries.map((secondary) => {
                                    const secId = secondary.flow.flowId;
                                    const isOpen = openJourneySecondaryId === secId;
                                    return (
                                        <div
                                            key={secId}
                                            className="rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated overflow-hidden"
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setOpenJourneySecondaryId(isOpen ? null : secId)
                                                }
                                                aria-expanded={isOpen}
                                                className="h-auto w-full justify-between gap-2 rounded-none px-3 py-2.5 font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted"
                                            >
                                                <span className="flex min-w-0 flex-col items-start gap-1">
                                                    <span className="min-w-0 text-[11px] font-medium text-slate-800 dark:text-n-10 wrap-anywhere whitespace-normal leading-4">
                                                        {shortSecondaryName(secondary.flow)}
                                                    </span>
                                                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                        Servicing Flow
                                                    </span>
                                                </span>
                                                <span className="flex shrink-0 items-center gap-1.5">
                                                    <ChevronDownIcon
                                                        className={cn(
                                                            "size-3.5 text-slate-400 transition-transform duration-300",
                                                            isOpen && "rotate-180"
                                                        )}
                                                    />
                                                </span>
                                            </Button>
                                            <div
                                                className={cn(
                                                    "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                                                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                                )}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className="px-3 pb-3 pt-0.5">
                                                        {stepRows(
                                                            secId,
                                                            secondary.items,
                                                            false,
                                                            (() => {
                                                                const secGroups =
                                                                    getSimplifiedGroups(
                                                                        secondary.flow
                                                                    );
                                                                return secGroups
                                                                    ? annotateSimplifiedItems(
                                                                          secondary.items,
                                                                          secGroups
                                                                      )
                                                                    : null;
                                                            })()
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── API Reference View: toggle ON (or no simplified config) ──────────────
    return (
        <div className="space-y-3">
            {toggleBar}
            {groups.map((group) => {
                const groupId = group.primary.flowId;
                const isGroupOpen = openGroupId === groupId;
                const hasSecondaries = group.secondaries.length > 0;

                return (
                    <div
                        key={groupId}
                        className="rounded-xl border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated shadow-sm overflow-hidden"
                    >
                        {/* ── Primary flow header: toggles the whole card ── */}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpenGroupId(isGroupOpen ? null : groupId)}
                            aria-expanded={isGroupOpen}
                            className="h-auto w-full justify-between gap-2 rounded-none p-4 pb-3 font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted"
                        >
                            <span className="flex min-w-0 flex-col items-start gap-2">
                                <span className="min-w-0 text-body-2 font-semibold text-gray-900 dark:text-n-10 wrap-anywhere whitespace-normal leading-5">
                                    {flowTitle(groupId)}
                                </span>
                                {group.isExplicitPrimary && (
                                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                        Main Path
                                    </span>
                                )}
                            </span>
                            <ChevronDownIcon
                                className={cn(
                                    "size-4 shrink-0 text-slate-400 transition-transform duration-300",
                                    isGroupOpen && "rotate-180"
                                )}
                            />
                        </Button>

                        <div
                            className={cn(
                                "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                                isGroupOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            )}
                        >
                            <div className="overflow-hidden">
                                {/* PREREQUISITE flows: collapsible, above the primary's calls */}
                                {group.prerequisites.length > 0 && (
                                    <div className="px-4 pb-2 space-y-1.5 pt-2.5">
                                        {group.prerequisites.map((prereq) => {
                                            const prereqId = prereq.flow.flowId;
                                            const isOpen = openPrereqId === prereqId;
                                            return (
                                                <div
                                                    key={prereqId}
                                                    className="rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated overflow-hidden"
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setOpenPrereqId(
                                                                isOpen ? null : prereqId
                                                            )
                                                        }
                                                        aria-expanded={isOpen}
                                                        className="h-auto w-full justify-between gap-2 rounded-none px-3 py-2 font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted"
                                                    >
                                                        <span className="flex min-w-0 flex-col items-start gap-1">
                                                            <span className="min-w-0 text-[12px] font-medium text-slate-800 dark:text-n-10 wrap-anywhere whitespace-normal leading-4">
                                                                {flowTitle(prereqId)}
                                                            </span>
                                                            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                                                                Prerequisite
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-1.5">
                                                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-surface-muted dark:text-n-40">
                                                                {prereq.stepCount} calls
                                                            </span>
                                                            <ChevronDownIcon
                                                                className={cn(
                                                                    "size-3.5 text-slate-400 transition-transform duration-300",
                                                                    isOpen && "rotate-180"
                                                                )}
                                                            />
                                                        </span>
                                                    </Button>
                                                    <div
                                                        className={cn(
                                                            "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                                                            isOpen
                                                                ? "grid-rows-[1fr]"
                                                                : "grid-rows-[0fr]"
                                                        )}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <div className="px-8 pb-2.5 pt-0.5">
                                                                {stepRows(prereqId, prereq.items)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Primary flow's full call sequence, with stepper rail */}
                                <div className="px-4 pb-3">
                                    {stepRows(
                                        groupId,
                                        group.primaryItems,
                                        true,
                                        simplifiedAnnotations.get(groupId)
                                    )}
                                </div>

                                {/* ── Secondary flows: nested under the primary's calls ── */}
                                {hasSecondaries && (
                                    <div className="px-4 pb-3 space-y-1.5">
                                        {group.secondaries.map((secondary) => {
                                            const secondaryId = secondary.flow.flowId;
                                            const isOpen = openSecondaryId === secondaryId;
                                            return (
                                                <div
                                                    key={secondaryId}
                                                    className="rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated overflow-hidden"
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setOpenSecondaryId(
                                                                isOpen ? null : secondaryId
                                                            )
                                                        }
                                                        aria-expanded={isOpen}
                                                        className="h-auto w-full justify-between gap-2 rounded-none px-3 py-2 font-normal text-left hover:bg-slate-50 dark:hover:bg-surface-muted"
                                                    >
                                                        <span className="flex min-w-0 items-start gap-2">
                                                            <ArrowTurnDownRightIcon
                                                                className="mt-0.5 size-3.5 shrink-0 text-slate-400 dark:text-n-40"
                                                                aria-hidden
                                                            />
                                                            <span className="flex min-w-0 flex-col items-start gap-1">
                                                                <span className="min-w-0 text-[12px] font-medium text-slate-800 dark:text-n-10 wrap-anywhere whitespace-normal leading-4">
                                                                    {flowTitle(secondaryId)}
                                                                </span>
                                                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                                    Servicing Flow
                                                                </span>
                                                            </span>
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-1.5">
                                                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-surface-muted dark:text-n-40">
                                                                {secondary.stepCount} calls
                                                            </span>
                                                            <ChevronDownIcon
                                                                className={cn(
                                                                    "size-3.5 text-slate-400 transition-transform duration-300",
                                                                    isOpen && "rotate-180"
                                                                )}
                                                            />
                                                        </span>
                                                    </Button>
                                                    <div
                                                        className={cn(
                                                            "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                                                            isOpen
                                                                ? "grid-rows-[1fr]"
                                                                : "grid-rows-[0fr]"
                                                        )}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <div className="px-3 pb-2.5 pt-0.5">
                                                                {stepRows(
                                                                    secondaryId,
                                                                    secondary.items
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FlowsHierarchyAccordion;
