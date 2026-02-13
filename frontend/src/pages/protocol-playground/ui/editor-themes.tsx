export const DarkSkyBlueTheme = {
    base: "vs-dark",
    inherit: true,
    rules: [
        // JavaScript/TypeScript tokens
        { token: "comment", foreground: "6A9FB5", fontStyle: "italic" },
        { token: "comment.doc", foreground: "729FC0", fontStyle: "italic" },
        { token: "keyword", foreground: "87CEEB", fontStyle: "bold" },
        { token: "string", foreground: "7DD3C0" },
        { token: "number", foreground: "4FC3F7" },
        { token: "type", foreground: "00BCD4" },
        { token: "function", foreground: "26C6DA" },
        { token: "variable", foreground: "E0F7FA" },
        { token: "identifier", foreground: "E0F7FA" },

        // JSON-specific tokens
        { token: "string.key.json", foreground: "87CEEB", fontStyle: "bold" },
        { token: "string.value.json", foreground: "7DD3C0" },
        { token: "number.json", foreground: "4FC3F7" },
        { token: "keyword.json", foreground: "26C6DA" },
        { token: "delimiter.bracket.json", foreground: "87CEEB" },
        { token: "delimiter.array.json", foreground: "E0F7FA" },
        { token: "delimiter.colon.json", foreground: "87CEEB" },
        { token: "delimiter.comma.json", foreground: "E0F7FA" },
    ],
    colors: {
        "editor.background": "#0A1929",
        "editor.foreground": "#E0F7FA",
        "editor.lineHighlightBackground": "#1A2B3D",
        "editor.selectionBackground": "#2C5364",
        "editorCursor.foreground": "#87CEEB",
        "editorLineNumber.foreground": "#4A90A4",
        "editorLineNumber.activeForeground": "#87CEEB",
        "editor.selectionHighlightBackground": "#2C536450",
        "editorIndentGuide.background": "#1A2B3D",
        "editorIndentGuide.activeBackground": "#2C5364",

        // Enhanced Hover Widget Styling
        "editorHoverWidget.background": "#0D1F2D",
        "editorHoverWidget.foreground": "#E0F7FA",
        "editorHoverWidget.border": "#4FC3F7",
        "editorHoverWidget.statusBarBackground": "#1A2B3D",

        // Hover highlight (when hovering over variables/references)
        "editor.hoverHighlightBackground": "#2C536430",

        // Suggest/Autocomplete Widget (similar styling for consistency)
        "editorSuggestWidget.background": "#0D1F2D",
        "editorSuggestWidget.border": "#4FC3F7",
        "editorSuggestWidget.foreground": "#E0F7FA",
        "editorSuggestWidget.highlightForeground": "#87CEEB",
        "editorSuggestWidget.selectedBackground": "#2C5364",
        "editorSuggestWidget.selectedForeground": "#FFFFFF",
        "editorSuggestWidget.focusHighlightForeground": "#87CEEB",

        // Widget shadow for depth
        "widget.shadow": "#00000050",
    },
};
