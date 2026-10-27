import {
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    Bars3Icon,
    CodeBracketSquareIcon,
    CubeTransparentIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { Badge } from "@components/Shadcn/Badge";
import { CODE_DIALOG_FILES, STAGES } from "@pages/protocol-studio/ui/editor/constants";
import { splitFileName } from "@pages/protocol-studio/ui/editor/inspector/constants";
import type {
    HeroIcon,
    IEditorHeaderBarProps,
    StageStatus,
} from "@pages/protocol-studio/ui/editor/types";

interface IUtilityItem {
    label: string;
    hint: string;
    Icon: HeroIcon;
    onSelect: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl+";

const pillTone = (status: StageStatus) =>
    status.errors > 0 ? "error" : status.warnings > 0 ? "warn" : "ok";

/**
 * The header: back, title, then the **stage bar** — Specification › Protocol
 * › Journeys › Review, a pipeline read left to right, each stage with a
 * one-line status — then the config chips, validity, helpers and utilities.
 */
export const EditorHeaderBar = ({
    config,
    validity,
    stage,
    onStageChange,
    stageStatus,
    isFullscreen,
    onToggleFullscreen,
    onExit,
    onOpenHelpers,
    onViewRawConfig,
    onViewTypes,
    onDownloadConfig,
    typesControl,
}: IEditorHeaderBarProps) => {
    const { meta } = config;
    const helpersFile = splitFileName(CODE_DIALOG_FILES.helpers.label);
    const utilities: IUtilityItem[] = [
        {
            label: "Download",
            hint: "Save the config as config.json",
            Icon: ArrowDownTrayIcon,
            onSelect: onDownloadConfig,
        },
        {
            label: "View raw",
            hint: "The whole config.json, read-only",
            Icon: CodeBracketSquareIcon,
            onSelect: onViewRawConfig,
        },
        {
            label: "View types",
            hint: "Payload, sessionData and helper types for step code",
            Icon: CubeTransparentIcon,
            onSelect: onViewTypes,
        },
    ];

    return (
        <header className="studio-glass studio-header flex items-center gap-3 px-2.5">
            <button
                type="button"
                className="studio-key studio-key-icon"
                onClick={onExit}
                aria-label="Back to setup"
                title="Back to setup — discards this in-memory config"
            >
                <ArrowLeftIcon />
            </button>

            <div className="flex shrink-0 items-center gap-2">
                <span className="studio-title">Protocol Studio</span>
                <span className="studio-chip" title={`${meta.domain} ${meta.version}`}>
                    <span className="studio-chip-value">{meta.domain}</span>
                    <span className="studio-chip-label">{meta.version}</span>
                </span>
            </div>

            <span className="studio-divider" aria-hidden="true" />

            <nav className="studio-stages" aria-label="Stages">
                {STAGES.map(({ id, label, hint, Icon }, index) => {
                    const status = stageStatus[id];
                    const isActive = id === stage;
                    return (
                        <button
                            key={id}
                            type="button"
                            className="studio-stage"
                            data-active={isActive || undefined}
                            data-tone={pillTone(status)}
                            aria-current={isActive ? "step" : undefined}
                            onClick={() => onStageChange(id)}
                            title={`${label} · ${hint}\n${MOD}${index + 1}`}
                        >
                            <span className="studio-stage-index">{index + 1}</span>
                            <Icon className="studio-stage-icon" />
                            <span className="studio-stage-text">
                                <span className="studio-stage-label">{label}</span>
                                <span className="studio-stage-summary">{status.summary}</span>
                            </span>
                            {status.errors + status.warnings > 0 ? (
                                <span
                                    className="studio-stage-pill"
                                    title={`${status.errors} errors · ${status.warnings} warnings`}
                                >
                                    {status.errors > 0 ? status.errors : status.warnings}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </nav>

            <span className="min-w-0 flex-1" />

            {typesControl}

            <Badge
                variant={validity.ok ? "success" : "error"}
                className="h-6.5 gap-1.5 px-2.5"
                title={validity.ok ? "MockRunnerV2 accepts this config" : validity.error}
            >
                <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {validity.ok ? "Valid" : "Invalid"}
            </Badge>

            <span className="studio-divider" aria-hidden="true" />

            <button
                type="button"
                className="studio-key studio-mono"
                onClick={onOpenHelpers}
                title={`${CODE_DIALOG_FILES.helpers.label} · ${CODE_DIALOG_FILES.helpers.description}`}
            >
                <WrenchScrewdriverIcon />
                <span className="studio-file-name">
                    {helpersFile.base}
                    <span className="studio-file-ext">{helpersFile.ext}</span>
                </span>
            </button>

            {/* Opens on hover, and on keyboard focus (focus-within), with no click needed. */}
            <div className="studio-menu">
                <button
                    type="button"
                    className="studio-key studio-key-icon"
                    aria-label="More actions"
                    aria-haspopup="true"
                    title="More actions"
                >
                    <Bars3Icon />
                </button>
                <div className="studio-menu-pop">
                    <ul className="studio-glass studio-menu-list" aria-label="More actions">
                        {utilities.map(({ label, hint, Icon, onSelect }) => (
                            <li key={label}>
                                <button
                                    type="button"
                                    className="studio-menu-item"
                                    onClick={(e) => {
                                        // Drop focus so the menu closes once the pointer leaves.
                                        e.currentTarget.blur();
                                        onSelect();
                                    }}
                                >
                                    <Icon />
                                    <span className="flex min-w-0 flex-col items-start">
                                        <span className="studio-menu-item-label">{label}</span>
                                        <span className="studio-menu-item-hint">{hint}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <button
                type="button"
                className="studio-key studio-key-icon"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
                {isFullscreen ? <ArrowsPointingInIcon /> : <ArrowsPointingOutIcon />}
            </button>
        </header>
    );
};

export default EditorHeaderBar;
