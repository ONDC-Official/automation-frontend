import type { ReactNode } from "react";
import { StepGroup } from "@pages/protocol-playground/utils/step-group";
import { MockPlaygroundConfigType } from "@ondc/automation-mock-runner";
import { PlaygroundContextProps } from "@pages/protocol-playground/context/playground-context";

export type PlaygroundActionVariant =
    | "play"
    | "view"
    | "steps"
    | "refresh"
    | "delete"
    | "expand"
    | "retrigger";

export interface IPlaygroundActionButtonProps {
    label: string;
    variant: PlaygroundActionVariant;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
}

export interface IPlaygroundToolbarProps {
    domain?: string;
    version?: string;
    flowId?: string;
    useCaseId?: string;
    stepGroup: StepGroup;
    onStepGroupChange: (group: StepGroup) => void;
    mainStepCount: number;
    extraStepCount: number;
    hasSteps: boolean;
    isTimelineOpen: boolean;
    onToggleTimeline: () => void;
    onExport: () => void;
    onExportForDeployment: () => void;
    onImport: () => void;
    onImportFromGitHub: () => void;
    onClear: () => void;
    onRun: () => void;
    onRunCurrent: () => void;
    onRetrigger: () => void;
    onCreateFlowSession: () => void;
    onBack: () => void;
    onHelp: () => void;
    onEditMeta: () => void;
    onViewTrace: () => void;
    onEditRaw: () => void;
    onAddAction: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export interface IActionData {
    id: string;
    stepNumber?: number;
    config: MockPlaygroundConfigType["steps"][number];
    responseFor?: string | null;
    completed: boolean;
}

export interface IActionDetailsCardProps {
    action: IActionData;
    onAddBefore?: (id: string) => void;
    onAddAfter?: (id: string) => void;
    onEditAction?: (id: string) => void;
    onDeleteAction?: (id: string) => void;
    playgroundContext?: PlaygroundContextProps;
}

export interface IFieldRow {
    label: string;
    value: string;
    badgeClassName: string;
}
export interface IMetaBadgeProps {
    value: string;
    className?: string;
    showTooltip?: boolean;
}

export interface IEditMenuItem {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    destructive?: boolean;
}
