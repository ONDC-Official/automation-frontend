import JsonView from "@uiw/react-json-view";

export type AppJsonViewerProps = Omit<React.ComponentProps<typeof JsonView>, "value" | "style"> & {
    value: unknown;
    style?: React.CSSProperties;
    containerClassName?: string;
    toolbarClassName?: string;
    viewerWrapperClassName?: string;
    transparentBackground?: boolean;
    /**
     * Render the viewer with the opposite of the app's active theme. Useful for
     * panels (e.g. the playground Session Manager) that intentionally invert the
     * app theme via the aliased gray/slate palette.
     */
    invertTheme?: boolean;
    showToolbar?: boolean;
    showSearch?: boolean;
    showExpandCollapse?: boolean;
    showDownload?: boolean;
    showFullscreen?: boolean;
    searchPlaceholder?: string;
    downloadFileName?: string;
    noResultsText?: string;
    /** Extra controls rendered at the end of the toolbar's right-side action group. */
    toolbarEnd?: React.ReactNode;
};
