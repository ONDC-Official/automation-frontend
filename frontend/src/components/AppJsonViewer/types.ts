import JsonView from "@uiw/react-json-view";

export type AppJsonViewerProps = Omit<React.ComponentProps<typeof JsonView>, "value" | "style"> & {
    value: unknown;
    style?: React.CSSProperties;
    containerClassName?: string;
    toolbarClassName?: string;
    viewerWrapperClassName?: string;
    transparentBackground?: boolean;
    showToolbar?: boolean;
    showSearch?: boolean;
    showExpandCollapse?: boolean;
    showDownload?: boolean;
    showFullscreen?: boolean;
    searchPlaceholder?: string;
    downloadFileName?: string;
    noResultsText?: string;
};
