export const EDITOR_CONFIG = {
    themes: {
        light: "vs",
        dark: "vs-dark",
    },
    language: "json",
    fontSize: 16,
    padding: { top: 16, bottom: 16 },
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
};

export const getEditorThemeName = (theme: "light" | "dark"): string =>
    theme === "dark" ? EDITOR_CONFIG.themes.dark : EDITOR_CONFIG.themes.light;
