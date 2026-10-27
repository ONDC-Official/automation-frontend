import {
    AdjustmentsHorizontalIcon,
    BoltIcon,
    CircleStackIcon,
    CodeBracketIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    DocumentCheckIcon,
    ArrowPathIcon,
    FingerPrintIcon,
    PencilSquareIcon,
    ShieldCheckIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import type { editor } from "monaco-editor";

import type {
    CodeLanguage,
    HeroIcon,
    InspectorTab,
    InspectorTabId,
    NodeSectionId,
} from "@pages/protocol-studio/ui/editor/types";

/**
 * A node's four sections, in the order the segmented control shows them.
 * Each holds one or more tabs; a section with one tab shows no tab row.
 */
export const NODE_SECTIONS: {
    id: NodeSectionId;
    label: string;
    description: string;
    Icon: HeroIcon;
}[] = [
    {
        id: "definition",
        label: "Definition",
        description: "The node's own fields: kind, owner, behaviour, …",
        Icon: AdjustmentsHorizontalIcon,
    },
    {
        id: "validation",
        label: "Validation",
        description:
            "validator — checks the payload —, match — recognises it — and the api's validations.yaml tests",
        Icon: ShieldCheckIcon,
    },
    {
        id: "generation",
        label: "Generation",
        description: "requirements, generate, defaultPayload and inputs: how the payload is built",
        Icon: SparklesIcon,
    },
    {
        id: "session",
        label: "Session",
        description: "saveData: what this step writes into session data",
        Icon: CircleStackIcon,
    },
];

/** The step-function tabs' extension and Monaco language, per code language. */
const CODE_FILE = {
    typescript: { ext: "ts", language: "typescript" },
    javascript: { ext: "js", language: "javascript" },
} as const;

/**
 * Same per-step files as v1's left tabs, grouped into the four sections,
 * plus the two panes (`validations.yaml`, `saveData`). helpers.ts and the raw
 * config open from the header. A TypeScript node's functions are `.ts` (typed
 * from the spec); a JavaScript node's, imported from a published flow, stay `.js`.
 */
export const getInspectorTabs = (codeLanguage: CodeLanguage = "typescript"): InspectorTab[] => {
    const { ext, language } = CODE_FILE[codeLanguage];
    return [
        {
            id: "exit",
            label: `exit.${ext}`,
            description: "Repeat until: the node runs again until this returns true",
            Icon: ArrowPathIcon,
            section: "definition",
            language,
        },
        {
            id: "validate",
            label: `validator.${ext}`,
            description: "Checks this step's payload (the validate function)",
            Icon: ShieldCheckIcon,
            section: "validation",
            language,
        },
        {
            id: "match",
            label: `match.${ext}`,
            description:
                "Whether an incoming payload is this step at all — used where alternatives share an API",
            Icon: FingerPrintIcon,
            section: "validation",
            language,
        },
        {
            id: "validations",
            label: "validations.yaml",
            description: "The api's tests from the deployed contract, read-only",
            Icon: DocumentCheckIcon,
            section: "validation",
        },
        {
            id: "requirements",
            label: `requirements.${ext}`,
            description: "Decides whether this step can run",
            Icon: ClipboardDocumentListIcon,
            section: "generation",
            language,
        },
        {
            id: "generate",
            label: `generate.${ext}`,
            description: "Builds the payload this step sends",
            Icon: BoltIcon,
            section: "generation",
            language,
        },
        {
            id: "defaultPayload",
            label: "defaultPayload.json",
            description: "Starting payload handed to generate",
            Icon: CubeIcon,
            section: "generation",
            language: "json",
        },
        {
            id: "inputs",
            label: "inputs.json",
            description: "User inputs this step asks for",
            Icon: PencilSquareIcon,
            section: "generation",
            language: "json",
        },
        {
            id: "saveData",
            label: "saveData",
            description: "What this step writes into session data once its payload exists",
            Icon: CircleStackIcon,
            section: "session",
        },
    ];
};

/** A decision node's one file: `decide`, always TypeScript. */
export const DECISION_TABS: InspectorTab[] = [
    {
        id: "decide",
        label: "decide.ts",
        description: "Returns the case whose wire is followed",
        Icon: CodeBracketIcon,
        section: "generation",
        language: "typescript",
    },
];

/** The tabs of a new (TypeScript) node. */
export const INSPECTOR_TABS = getInspectorTabs();

/** The section a tab belongs to; Properties is Definition. */
export const sectionOf = (tab: InspectorTabId, tabs: InspectorTab[]): NodeSectionId =>
    tab === "properties" ? "definition" : (tabs.find((t) => t.id === tab)?.section ?? "definition");

/** The tab a section opens on: Properties for Definition, else its first tab. */
export const firstTabOf = (section: NodeSectionId, tabs: InspectorTab[]): InspectorTabId =>
    section === "definition"
        ? "properties"
        : (tabs.find((t) => t.section === section)?.id ?? "properties");

/** Splits `generate.js` into `generate` and `.js`, so the extension can be dimmed. */
export const splitFileName = (label: string) => {
    const dot = label.lastIndexOf(".");
    return dot > 0
        ? { base: label.slice(0, dot), ext: label.slice(dot) }
        : { base: label, ext: "" };
};

const MONACO_THEME_LIGHT_NAME = "studio-glass-light";
const MONACO_THEME_DARK_NAME = "studio-glass-dark";

/** The Monaco theme for the app theme currently applied to the document. */
export const getStudioMonacoThemeName = (theme: "light" | "dark") =>
    theme === "dark" ? MONACO_THEME_DARK_NAME : MONACO_THEME_LIGHT_NAME;

/**
 * Transparent editor surface, so the recessed glass well behind it shows
 * through. Syntax colours are drawn from the app's brand / status / chart tokens.
 */
const STUDIO_MONACO_THEME_LIGHT: editor.IStandaloneThemeData = {
    base: "vs",
    inherit: true,
    rules: [
        { token: "comment", foreground: "7A869A", fontStyle: "italic" },
        { token: "keyword", foreground: "0081CC" },
        { token: "string", foreground: "087C57" },
        { token: "number", foreground: "986106" },
        { token: "regexp", foreground: "B63B39" },
        { token: "type", foreground: "003E64" },
        { token: "identifier", foreground: "172B4D" },
        { token: "delimiter", foreground: "5E6C84" },
        { token: "string.key.json", foreground: "0065A3" },
        { token: "string.value.json", foreground: "087C57" },
    ],
    colors: {
        "editor.background": "#00000000",
        "editor.foreground": "#172B4D",
        "editorGutter.background": "#00000000",
        "editor.lineHighlightBackground": "#091E420A",
        "editor.lineHighlightBorder": "#00000000",
        "editorLineNumber.foreground": "#A5ADBA",
        "editorLineNumber.activeForeground": "#42526E",
        "editorCursor.foreground": "#0081CC",
        "editor.selectionBackground": "#0081CC33",
        "editor.inactiveSelectionBackground": "#0081CC1A",
        "editorIndentGuide.background1": "#091E4214",
        "editorIndentGuide.activeBackground1": "#091E422E",
        "editorBracketMatch.background": "#0081CC1F",
        "editorBracketMatch.border": "#0081CC66",
        "scrollbarSlider.background": "#091E421F",
        "scrollbarSlider.hoverBackground": "#091E4233",
        "scrollbarSlider.activeBackground": "#091E4247",
        "editorWidget.background": "#FFFFFF",
        "editorWidget.border": "#DFE1E6",
        "editorSuggestWidget.background": "#FFFFFF",
        "editorSuggestWidget.border": "#DFE1E6",
        "editorSuggestWidget.selectedBackground": "#E9F2FF",
        "editorHoverWidget.background": "#FFFFFF",
        "editorHoverWidget.border": "#DFE1E6",
        "editorStickyScroll.background": "#F4F5F7",
        "editorOverviewRuler.border": "#00000000",
    },
};

const STUDIO_MONACO_THEME_DARK: editor.IStandaloneThemeData = {
    base: "vs-dark",
    inherit: true,
    rules: [
        { token: "comment", foreground: "6B778C", fontStyle: "italic" },
        { token: "keyword", foreground: "3399DD" },
        { token: "string", foreground: "1BAF7A" },
        { token: "number", foreground: "EDA100" },
        { token: "regexp", foreground: "EE6E67" },
        { token: "type", foreground: "80BFFF" },
        { token: "identifier", foreground: "F4F5F7" },
        { token: "delimiter", foreground: "97A0AF" },
        { token: "string.key.json", foreground: "80BFFF" },
        { token: "string.value.json", foreground: "1BAF7A" },
    ],
    colors: {
        "editor.background": "#00000000",
        "editor.foreground": "#F4F5F7",
        "editorGutter.background": "#00000000",
        "editor.lineHighlightBackground": "#FFFFFF08",
        "editor.lineHighlightBorder": "#00000000",
        "editorLineNumber.foreground": "#505F79",
        "editorLineNumber.activeForeground": "#C1C7D0",
        "editorCursor.foreground": "#3399DD",
        "editor.selectionBackground": "#0081CC40",
        "editor.inactiveSelectionBackground": "#0081CC24",
        "editorIndentGuide.background1": "#FFFFFF0D",
        "editorIndentGuide.activeBackground1": "#FFFFFF26",
        "editorBracketMatch.background": "#0081CC2E",
        "editorBracketMatch.border": "#3399DD80",
        "scrollbarSlider.background": "#FFFFFF14",
        "scrollbarSlider.hoverBackground": "#FFFFFF24",
        "scrollbarSlider.activeBackground": "#FFFFFF33",
        "editorWidget.background": "#141414",
        "editorWidget.border": "#2A2A2A",
        "editorSuggestWidget.background": "#141414",
        "editorSuggestWidget.border": "#2A2A2A",
        "editorSuggestWidget.selectedBackground": "#0081CC33",
        "editorHoverWidget.background": "#141414",
        "editorHoverWidget.border": "#2A2A2A",
        "editorStickyScroll.background": "#0A0A0A",
        "editorOverviewRuler.border": "#00000000",
    },
};

export const STUDIO_MONACO_THEMES = [
    [MONACO_THEME_LIGHT_NAME, STUDIO_MONACO_THEME_LIGHT],
    [MONACO_THEME_DARK_NAME, STUDIO_MONACO_THEME_DARK],
] as const;
