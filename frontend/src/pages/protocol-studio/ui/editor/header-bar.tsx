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
import { CODE_DIALOG_FILES } from "@pages/protocol-studio/ui/editor/constants";
import { splitFileName } from "@pages/protocol-studio/ui/editor/inspector/constants";
import type { HeroIcon, IEditorHeaderBarProps } from "@pages/protocol-studio/ui/editor/types";

interface IHeaderChip {
    label: string;
    value: string;
    /** Long free text (description) may shrink and truncate; the rest keep their width. */
    shrink?: boolean;
}

interface IUtilityItem {
    label: string;
    hint: string;
    Icon: HeroIcon;
    onSelect: () => void;
}

export const EditorHeaderBar = ({
    config,
    validity,
    isFullscreen,
    onToggleFullscreen,
    onExit,
    onOpenHelpers,
    onViewRawConfig,
    onViewTypes,
    onDownloadConfig,
    typesControl,
}: IEditorHeaderBarProps) => {
    const { meta, transaction_data } = config;
    const chips: IHeaderChip[] = [
        { label: "Domain", value: meta.domain },
        { label: "Version", value: meta.version },
        ...(meta.use_case_id ? [{ label: "Use case", value: meta.use_case_id }] : []),
        ...(meta.config_version ? [{ label: "Config", value: meta.config_version }] : []),
        { label: "Txn", value: transaction_data.transaction_id.slice(0, 8) },
        { label: "Format", value: meta.playground_version },
        ...(meta.description ? [{ label: "About", value: meta.description, shrink: true }] : []),
    ];
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
            </div>

            <span className="studio-divider" aria-hidden="true" />

            <ul
                className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
                aria-label="Config"
            >
                {chips.map(({ label, value, shrink }) => (
                    <li
                        key={label}
                        className="studio-chip"
                        data-shrink={shrink || undefined}
                        title={`${label}: ${label === "Txn" ? transaction_data.transaction_id : value}`}
                    >
                        <span className="studio-chip-label">{label}</span>
                        <span className="studio-chip-value">{value}</span>
                    </li>
                ))}
            </ul>

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
