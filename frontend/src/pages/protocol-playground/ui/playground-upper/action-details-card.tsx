import { cn } from "@/lib/utils";
import { METHOD, METHOD_STYLES } from "@/pages/protocol-playground/ui/playground-upper/constants";
import {
    IActionDetailsCardProps,
    IDetailField,
} from "@pages/protocol-playground/ui/playground-upper/types";
import { ActionButton } from "@/pages/protocol-playground/ui/playground-upper/action-button";
import { CheckIcon } from "@heroicons/react/24/solid";
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

const ActionDetailsCard = ({
    action,
    onAddBefore,
    onAddAfter,
    onEditAction,
    onDeleteAction,
    playgroundContext,
}: IActionDetailsCardProps) => {
    const fields: IDetailField[] = [
        {
            label: "Owner",
            value: action.config.owner ?? "",
            toneClass:
                action.config.owner === "BPP"
                    ? "border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300"
                    : "border-brand-light-active bg-brand-light text-brand-normal dark:border-brand-normal/30 dark:bg-brand-normal/15 dark:text-brand-light",
        },
    ];

    if (action.config.responseFor && action.config.responseFor !== "NONE") {
        fields.push({
            label: "Response For",
            value: action.config.responseFor,
            toneClass:
                "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
        });
    }

    if (action.config.unsolicited !== undefined) {
        fields.push({
            label: "Unsolicited",
            value: action.config.unsolicited ? "Yes" : "No",
            toneClass: action.config.unsolicited
                ? "border-success-200 bg-success-50 text-success-800 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-200"
                : "border-error-500/30 bg-error-50 text-error-500 dark:bg-error-500/15",
        });
    }

    return (
        <div className="w-[320px] overflow-hidden rounded-xl bg-surface-elevated text-text-primary">
            <div className="flex items-center justify-between gap-2 bg-linear-to-b from-brand-light/60 to-surface-elevated px-4 py-3 dark:from-brand-normal/10">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                            METHOD_STYLES[METHOD]
                        )}
                    >
                        {METHOD}
                    </span>
                    <span className="truncate font-mono text-xs text-text-secondary">
                        /{action.config.api}
                    </span>
                </div>

                {action.completed && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-800 dark:bg-success-500/15 dark:text-success-200">
                        <CheckIcon className="size-3" /> Done
                    </span>
                )}
            </div>

            <div className="space-y-1.5 px-4 py-3">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-muted px-3 py-2"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            {field.label}
                        </span>
                        <span
                            className={cn(
                                "rounded-md border px-2 py-1 text-xs font-bold",
                                field.toneClass
                            )}
                        >
                            {field.value}
                        </span>
                    </div>
                ))}

                {action.config.description && (
                    <div className="rounded-lg bg-brand-light/60 px-3 py-2.5 dark:bg-brand-normal/10">
                        <p className="text-xs font-semibold leading-relaxed text-text-primary">
                            {action.config.description}
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-2 border-t border-border-default bg-surface-muted/60 px-4 py-3 dark:bg-surface-muted/40">
                <div className="grid grid-cols-3 gap-2">
                    <ActionButton
                        icon={<ArrowLeftIcon className="size-3.5" />}
                        label="Before"
                        onClick={() => onAddBefore?.(action.id)}
                    />
                    <ActionButton
                        icon={<ArrowRightIcon className="size-3.5" />}
                        label="After"
                        onClick={() => onAddAfter?.(action.id)}
                    />
                    <ActionButton
                        icon={<ArrowPathIcon className="size-3.5" />}
                        label="Reset"
                        onClick={() => playgroundContext?.resetTransactionHistory(action.id)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <ActionButton
                        icon={<PencilSquareIcon className="size-3.5" />}
                        label="Edit"
                        onClick={() => onEditAction?.(action.id)}
                        variant="primary"
                    />
                    <ActionButton
                        icon={<TrashIcon className="size-3.5" />}
                        label="Delete"
                        onClick={() => onDeleteAction?.(action.id)}
                        variant="danger"
                    />
                </div>
            </div>
        </div>
    );
};

export default ActionDetailsCard;
