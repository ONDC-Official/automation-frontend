import type { ReactNode } from "react";
import { StepGroup } from "@pages/protocol-playground/utils/step-group";

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

export interface IMetaBadgeProps {
    value: string;
    className?: string;
}

export interface IEditMenuItem {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    destructive?: boolean;
}
