import { useContext } from "react";
import Tippy from "@tippyjs/react";
import { MockPlaygroundConfigType, TransactionHistoryItem } from "@ondc/automation-mock-runner";
import { ArrowsRightLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import ActionDetailsCard from "@pages/protocol-playground/ui/playground-upper/action-details-card";

import "tippy.js/animations/shift-away-subtle.css";
import { Button } from "@/components/Shadcn/Button/button";

interface ActionTimelineProps {
    steps: MockPlaygroundConfigType["steps"];
    transactionHistory: TransactionHistoryItem[];
    activeApi: string | undefined;
    onApiSelect: (actionId: string) => void;
    onAddAction: () => void;
    onEditAction?: (actionId: string) => void;
    onDeleteAction?: (actionId: string) => void;
    onAddBefore?: (actionId: string) => void;
    onAddAfter?: (actionId: string) => void;
}

export const ActionTimeline = ({
    steps,
    transactionHistory,
    activeApi,
    onApiSelect,
    onAddAction,
    onEditAction,
    onDeleteAction,
    onAddBefore,
    onAddAfter,
}: ActionTimelineProps) => {
    const playgroundContext = useContext(PlaygroundContext);

    const actionData = steps.map((step, index) => {
        const runs = transactionHistory.filter((th) => th.action_id === step.action_id);
        const runCount = runs.length;
        return {
            id: step.action_id,
            stepNumber: index + 1,
            config: step,
            responseFor: step.responseFor,
            completed: runs.length > 0,
            runCount,
        };
    });

    return (
        <div className="flex h-16 shrink-0 items-center overflow-x-auto border border-border-default rounded-xl bg-surface-elevated px-6 dark:border-border-default">
            <div className="flex min-w-max items-center gap-0">
                {actionData.length === 0 ? (
                    <button
                        type="button"
                        onClick={onAddAction}
                        className="text-body-2 font-medium text-text-secondary transition-colors hover:text-brand-normal"
                    >
                        No steps yet — use &quot;Add First Action&quot; in the toolbar
                    </button>
                ) : (
                    actionData.map((action, index) => {
                        const isActive = activeApi === action.id;
                        const isCompleted = action.completed;

                        let nextAction: (typeof actionData)[0] | null = null;
                        if (index + 1 < actionData.length) {
                            nextAction = actionData[index + 1];
                        }
                        const isPair = nextAction && nextAction.responseFor === action.id;

                        return (
                            <div key={action.id} className="flex items-center">
                                <Tippy
                                    content={
                                        <ActionDetailsCard
                                            action={action}
                                            onAddAfter={onAddAfter}
                                            onAddBefore={onAddBefore}
                                            onEditAction={onEditAction}
                                            onDeleteAction={onDeleteAction}
                                            playgroundContext={playgroundContext}
                                        />
                                    }
                                    interactive={true}
                                    animation="shift-away-subtle"
                                    placement="bottom"
                                    arrow={false}
                                    offset={[0, 12]}
                                    maxWidth="none"
                                    appendTo={() =>
                                        (document.fullscreenElement as Element) ?? document.body
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        onClick={() => onApiSelect(action.id)}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-2 py-2 transition-all duration-200",
                                            isActive ? "scale-105" : "hover:scale-[1.02]"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                                                    isCompleted
                                                        ? "bg-brand-normal text-n-0 ring-4 ring-brand-light dark:ring-brand-dark/30"
                                                        : isActive
                                                          ? "bg-brand-normal text-n-0 ring-4 ring-brand-light-active dark:ring-brand-dark/30"
                                                          : "border-2 border-border-default bg-surface-page text-text-secondary group-hover:border-brand-normal group-hover:text-brand-normal"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckIcon className="size-4" />
                                                ) : (
                                                    action.stepNumber
                                                )}
                                            </div>

                                            {isActive && !isCompleted ? (
                                                <span className="absolute inset-0 animate-ping rounded-full bg-brand-normal opacity-20" />
                                            ) : null}

                                            {action.runCount > 1 ? (
                                                <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-alert-500 px-1 text-[10px] leading-none font-bold text-n-0 ring-2 ring-surface-page">
                                                    ×{action.runCount}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-col items-start">
                                            <span
                                                className={cn(
                                                    "text-sm font-semibold transition-colors",
                                                    isCompleted
                                                        ? "text-text-primary"
                                                        : isActive
                                                          ? "text-brand-normal"
                                                          : "text-text-secondary group-hover:text-text-primary"
                                                )}
                                            >
                                                {action.id}
                                            </span>
                                        </div>

                                        {isActive ? (
                                            <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-brand-normal" />
                                        ) : null}
                                    </Button>
                                </Tippy>

                                {index !== actionData.length - 1 ? (
                                    <div className="flex w-10 items-center justify-center">
                                        {isPair ? (
                                            <ArrowsRightLeftIcon
                                                className={cn(
                                                    "size-[18px] transition-all duration-300",
                                                    action.completed
                                                        ? "text-brand-normal"
                                                        : "text-n-60 dark:text-text-secondary"
                                                )}
                                            />
                                        ) : (
                                            <ArrowRightIcon
                                                className={cn(
                                                    "size-[18px] transition-all duration-300",
                                                    action.completed
                                                        ? "text-brand-normal"
                                                        : "text-n-60 dark:text-text-secondary"
                                                )}
                                            />
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
