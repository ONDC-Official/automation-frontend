import {
    CodeBracketSquareIcon,
    CubeTransparentIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import type { CodeDialogFile, HeroIcon } from "@pages/protocol-studio/ui/editor/types";

/** Layout metrics. Keep in sync with the `--studio-*` defaults in studio-editor.css. */
export const EDITOR_GAP = 10;
export const EDITOR_HEADER_HEIGHT = 52;
export const DOCK_BAR_HEIGHT = 40;

export const INSPECTOR_WIDTH = { initial: 440, min: 320 } as const;
export const EXPLORER_WIDTH = { initial: 300, min: 260 } as const;
/** The collapsed explorer: a rail just wide enough for its icon keys. */
export const EXPLORER_RAIL_WIDTH = 44;
export const DOCK_HEIGHT = { initial: 260, min: 140 } as const;

/** The canvas keeps at least this much width between the explorer and the inspector. */
const MIN_CANVAS_WIDTH = 360;

/** A side panel's current width, as `useDragResize` last wrote it on the editor root. */
const readWidth = (container: HTMLElement, cssVar: string, fallback: number) =>
    parseFloat(container.style.getPropertyValue(cssVar)) || fallback;

/** The explorer's width on screen: the rail while collapsed, else its resizable width. */
const readExplorerWidth = (container: HTMLElement) =>
    parseFloat(container.style.getPropertyValue("--studio-explorer-visible")) ||
    readWidth(container, "--studio-explorer-w", EXPLORER_WIDTH.initial);

export const getInspectorMaxWidth = (container: HTMLElement) =>
    Math.min(
        container.clientWidth * 0.7,
        container.clientWidth - MIN_CANVAS_WIDTH - readExplorerWidth(container)
    );

export const getExplorerMaxWidth = (container: HTMLElement) =>
    Math.min(
        container.clientWidth * 0.4,
        container.clientWidth -
            MIN_CANVAS_WIDTH -
            readWidth(container, "--studio-inspector-w", INSPECTOR_WIDTH.initial)
    );

/** How long the graph pans when the explorer brings a flow or action into view. */
export const FOCUS_DURATION_MS = 420;

export const getDockMaxHeight = (container: HTMLElement) =>
    (container.clientHeight - EDITOR_HEADER_HEIGHT - EDITOR_GAP * 3) * 0.7;

/**
 * Graph grid: fine lines every 16px, heavier ones every 128px. React Flow hands
 * `color` to CSS as `--xy-background-pattern-color-props`, so these can be
 * variables — the light / dark values live in studio-editor.css.
 */
export const GRID = {
    minor: { gap: 16, color: "var(--studio-grid-minor)" },
    major: { gap: 128, color: "var(--studio-grid-major)" },
} as const;

export const AI_CHAT_SUGGESTIONS = [
    "Explain this config",
    "Draft a search → on_search flow",
    "What does helpers.ts provide?",
] as const;

export const AI_PLACEHOLDER_REPLY =
    "AI isn't connected in this preview yet — this panel is a layout skeleton.";

/** The config-level files the header opens in the code popup. */
export const CODE_DIALOG_FILES: Record<
    CodeDialogFile,
    { label: string; description: string; Icon: HeroIcon }
> = {
    helpers: {
        label: "helpers.ts",
        description: "Shared helpers, in TypeScript: compiled and prepended to every generate",
        Icon: WrenchScrewdriverIcon,
    },
    config: {
        label: "config.json",
        description: "The whole config as it would be exported, helpers.ts edits included",
        Icon: CodeBracketSquareIcon,
    },
    types: {
        label: "types.d.ts",
        description:
            "What step code is typed against: spec payloads, sessionData, the sandbox, helpers",
        Icon: CubeTransparentIcon,
    },
};
