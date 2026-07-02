import { useEffect, useRef, useState } from "react";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Shadcn/Dialog";
import { cn } from "@/lib/utils";
import { ArrowDownTrayIcon, CheckIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button/button";

interface IExportReviewModalProps {
    config: MockPlaygroundConfigType | null;
    onConfirm: (overrides: Record<string, string>) => void;
    onCancel: () => void;
    isDownloading?: boolean;
}

interface IStepCardProps {
    index: number;
    actionId: string;
    api: string;
    owner?: string;
    description: string;
    onChange: (value: string) => void;
}

const StepCard = ({ index, actionId, api, owner, description, onChange }: IStepCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const el = textareaRef.current;
            el.focus();
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [isEditing]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    };

    const ownerColor =
        owner === "BPP"
            ? "border-brand-light-active bg-brand-light text-brand-normal dark:bg-surface-muted"
            : "border-success-200 bg-success-50 text-success-800 dark:bg-success-800/20 dark:text-success-500";

    return (
        <div
            className={cn(
                "group rounded-lg border bg-surface-elevated transition-all duration-150",
                isEditing
                    ? "border-brand-normal shadow-md ring-2 ring-brand-normal/20"
                    : "border-border-default shadow-xs hover:border-brand-light-active hover:shadow-sm"
            )}
        >
            <div className="flex items-center gap-2 border-b border-border-default px-4 pt-3.5 pb-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-normal text-[11px] font-bold text-n-0">
                    {index + 1}
                </span>
                <span className="shrink-0 rounded-md border border-brand-light-active bg-brand-light px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-normal dark:bg-surface-muted">
                    {api}
                </span>
                {owner && (
                    <span
                        className={cn(
                            "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            ownerColor
                        )}
                    >
                        {owner}
                    </span>
                )}
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-secondary">
                    {actionId}
                </span>
                {isEditing ? (
                    <Button
                        size="xs"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsEditing(false);
                        }}
                    >
                        <CheckIcon className="size-3" />
                        Done
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="shrink-0 rounded-md p-1 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-brand-light hover:text-brand-normal dark:hover:bg-surface-muted"
                    >
                        <PencilIcon className="size-3.5" />
                    </Button>
                )}
            </div>

            <div
                className="cursor-text px-4 py-3"
                onClick={() => !isEditing && setIsEditing(true)}
                onKeyDown={() => undefined}
                role="presentation"
            >
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={description}
                        placeholder="Add a description for this step…"
                        onChange={(e) => onChange(e.target.value)}
                        onInput={handleInput}
                        onBlur={() => setIsEditing(false)}
                        className="min-h-[40px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-secondary"
                    />
                ) : description ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
                        {description}
                    </p>
                ) : (
                    <p className="text-sm leading-relaxed text-text-secondary italic">
                        Click to add a description…
                    </p>
                )}
            </div>
        </div>
    );
};

export const ExportReviewModal = ({
    config,
    onConfirm,
    onCancel,
    isDownloading = false,
}: IExportReviewModalProps) => {
    const [descriptions, setDescriptions] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!config) return;
        const initial: Record<string, string> = {};
        for (const step of config.steps) {
            initial[step.action_id] = step.description ?? "";
        }
        setDescriptions(initial);
    }, [config]);

    const stepCount = config?.steps.length ?? 0;
    const filledCount = Object.values(descriptions).filter((d) => d.trim().length > 0).length;

    return (
        <Dialog open={!!config} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex flex-row items-start gap-3.5 border-b border-border-default px-6 py-5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-light-active bg-brand-light dark:bg-surface-muted">
                        <ArrowDownTrayIcon className="size-[18px] text-brand-normal" />
                    </div>
                    <div className="min-w-0">
                        <DialogTitle>Review Step Descriptions</DialogTitle>
                        <DialogDescription className="mt-0.5">
                            Descriptions are embedded in the deployment YAML as documentation
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="shrink-0 px-6 pb-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-text-secondary">
                            {filledCount} of {stepCount} steps have descriptions
                        </span>
                        <span className="text-xs text-text-secondary">click any step to edit</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
                        <div
                            className="h-full rounded-full bg-brand-normal transition-all duration-300"
                            style={{
                                width: `${stepCount > 0 ? (filledCount / stepCount) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto px-6 pb-4">
                    {config?.steps.map((step, index) => (
                        <StepCard
                            key={step.action_id}
                            index={index}
                            actionId={step.action_id}
                            api={step.api}
                            owner={step.owner}
                            description={descriptions[step.action_id] ?? ""}
                            onChange={(value) =>
                                setDescriptions((prev) => ({ ...prev, [step.action_id]: value }))
                            }
                        />
                    ))}
                </div>

                <DialogFooter className="shrink-0 border-t border-border-default bg-surface-muted px-6 py-4 sm:justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light-active bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-normal dark:bg-surface-elevated">
                        {stepCount} {stepCount === 1 ? "step" : "steps"}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onCancel} disabled={isDownloading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onConfirm(descriptions)}
                            disabled={isDownloading}
                            isLoading={isDownloading}
                        >
                            <ArrowDownTrayIcon className="size-4" />
                            {isDownloading ? "Downloading…" : "Confirm & Download"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
