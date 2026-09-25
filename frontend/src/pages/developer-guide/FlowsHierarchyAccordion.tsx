import { FC, useEffect, useMemo, useState } from "react";
import {
    ArrowTurnDownRightIcon,
    ArrowsRightLeftIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button";
import { cn } from "@/lib/utils";
import type { FlowEntry, FlowStep, StepDisplayItem } from "./types";
import { getActionId } from "./utils";
import OwnerPill from "./shared/components/OwnerPill";
import {
    buildFlowHierarchies,
    type FlowHierarchyGroup,
} from "./FlowInformation/flowHierarchyPreview";

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

    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [openSecondaryId, setOpenSecondaryId] = useState<string | null>(null);
    const [openPrereqId, setOpenPrereqId] = useState<string | null>(null);

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

    const stepRows = (flowId: string, items: StepDisplayItem[], withStepper = false) => {
        const selectedItemIndex =
            withStepper && selectedFlow === flowId
                ? items.findIndex((item) => itemMatchesAction(item, selectedFlowAction))
                : -1;
        return (
            <div className="flex flex-col gap-2.5 pt-2.5">
                {items.map((item, i) => (
                    <div key={i} className="flex min-w-0 items-center gap-2.5">
                        {withStepper &&
                            stepperBullet(
                                selectedItemIndex >= 0 && i <= selectedItemIndex,
                                selectedItemIndex >= 0 && i < selectedItemIndex,
                                i === 0,
                                i === items.length - 1
                            )}
                        {item.type === "pair" ? (
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
                            <div className="min-w-0 flex-1">{stepButton(flowId, item.step)}</div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-3">
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
                                    {stepRows(groupId, group.primaryItems, true)}
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
                                                                    Alternate Path
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
