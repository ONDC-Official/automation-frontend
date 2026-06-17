import { Button } from "@/components/Shadcn/Button/button";
import { Badge } from "@/components/Shadcn/Badge/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/Shadcn/DropDownMenu/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    ArrowUpTrayIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    PencilSquareIcon,
    PlusIcon,
    QuestionMarkCircleIcon,
    ServerStackIcon,
} from "@heroicons/react/24/outline";
import { PlaygroundActionButton } from "@pages/protocol-playground/ui/playground-upper/PlaygroundActionButton";
import type {
    IMetaBadgeProps,
    IPlaygroundToolbarProps,
} from "@pages/protocol-playground/ui/playground-upper/types";

const MetaBadge = ({ value, className }: IMetaBadgeProps) => (
    <Badge
        variant="outline"
        className={cn(
            "rounded-lg border-brand-light-active bg-brand-light px-3 py-1.5 text-body-2 font-medium text-text-primary dark:border-border-default dark:bg-surface-muted",
            className
        )}
    >
        {value}
    </Badge>
);

export const PlaygroundHeader = ({
    domain,
    version,
    flowId,
    useCaseId,
    stepGroup,
    onStepGroupChange,
    mainStepCount,
    extraStepCount,
    hasSteps,
    isTimelineOpen,
    onToggleTimeline,
    onExport,
    onExportForDeployment,
    onImport,
    onImportFromGitHub,
    onClear,
    onRun,
    onRunCurrent,
    onRetrigger,
    onCreateFlowSession,
    onBack,
    onHelp,
    onEditMeta,
    onViewTrace,
    onEditRaw,
    onAddAction,
    isFullscreen,
    onToggleFullscreen,
}: IPlaygroundToolbarProps) => (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-n-30 bg-surface-elevated my-6 py-4 px-4 dark:border-border-default">
        <div className="flex shrink-0 items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                title="Back to starter"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-normal/50"
            >
                <ArrowLeftIcon className="size-4" />
            </Button>
            <span className="whitespace-nowrap text-body-1 font-bold uppercase tracking-wide text-brand-normal">
                PLAYGROUND
            </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto *:shrink-0">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onStepGroupChange(stepGroup === "main" ? "extra" : "main")}
                title="Click to switch step group"
                className="rounded-lg focus-visible:outline-none hover:bg-transparent"
            >
                <MetaBadge
                    value={
                        stepGroup === "main"
                            ? `Main Steps (${mainStepCount})`
                            : `Extra Steps (${extraStepCount})`
                    }
                />
            </Button>

            {domain ? <MetaBadge value={domain} className="max-w-40 truncate" /> : null}
            {version ? <MetaBadge value={version} className="max-w-40 truncate" /> : null}
            {flowId ? <MetaBadge value={flowId} className="max-w-48 truncate" /> : null}
            {useCaseId ? <MetaBadge value={useCaseId} className="max-w-40 truncate" /> : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <PlaygroundActionButton label="Run next step" variant="play" onClick={onRun} />
            <PlaygroundActionButton
                label="View execution trace"
                variant="view"
                onClick={onViewTrace}
            />
            <PlaygroundActionButton
                label="Toggle steps timeline"
                variant="steps"
                onClick={onToggleTimeline}
                active={isTimelineOpen}
            />
            <PlaygroundActionButton
                label="Run up to current step"
                variant="refresh"
                onClick={onRunCurrent}
            />
            <PlaygroundActionButton label="Clear all" variant="delete" onClick={onClear} />
            {stepGroup === "extra" ? (
                <PlaygroundActionButton
                    label="Retrigger selected extra step"
                    variant="retrigger"
                    onClick={onRetrigger}
                />
            ) : null}
            {onToggleFullscreen ? (
                <PlaygroundActionButton
                    label={isFullscreen ? "Exit full screen" : "Full screen"}
                    variant="expand"
                    onClick={onToggleFullscreen}
                />
            ) : null}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-1">
                        <PencilSquareIcon className="size-4" />
                        Edit
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={onEditMeta}>
                        <PencilSquareIcon className="size-4" />
                        Edit flow info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onExport}>
                        <ArrowDownTrayIcon className="size-4" />
                        Download (not for deployment)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onImport}>
                        <ArrowUpTrayIcon className="size-4" />
                        Upload JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onImportFromGitHub}>
                        <ServerStackIcon className="size-4" />
                        Import from GitHub
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportForDeployment}>
                        <DocumentTextIcon className="size-4" />
                        Export deployment YAML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onEditRaw}>
                        <DocumentTextIcon className="size-4" />
                        Edit raw config
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onCreateFlowSession}>
                        <Cog6ToothIcon className="size-4" />
                        Create live session
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onHelp}>
                        <QuestionMarkCircleIcon className="size-4" />
                        How to use the Playground
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={onAddAction} className="ml-1">
                <PlusIcon className="size-4" />
                {hasSteps ? "Add Action" : "Add First Action"}
            </Button>
        </div>
    </div>
);
