import { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { useAppliedTheme } from "@/context/theme/useAppliedTheme";
import { cn } from "@/lib/utils";
import { AppJsonViewerProps } from "@/components/AppJsonViewer/types";
import { filterJsonBySearch, hasVisibleResults } from "@/components/AppJsonViewer/utils";
import AppJsonViewerToolbar from "@/components/AppJsonViewer/Toolbar";
import AppJsonViewerNoResults from "@/components/AppJsonViewer/NoResults";

const AppJsonViewer = ({
    value,
    children = null,
    showToolbar = false,
    showSearch = false,
    showExpandCollapse = false,
    showDownload = false,
    showFullscreen = false,
    searchPlaceholder = "Search",
    downloadFileName = "payload.json",
    noResultsText = "No results found",
    transparentBackground = true,
    style,
    displayDataTypes = false,
    shortenTextAfterLength = 0,
    containerClassName,
    toolbarClassName,
    viewerWrapperClassName,
    ...jsonViewProps
}: AppJsonViewerProps) => {
    const appliedTheme = useAppliedTheme();
    const [searchTerm, setSearchTerm] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const [viewerKey, setViewerKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const showToolbarSection =
        showToolbar || showSearch || showExpandCollapse || showDownload || showFullscreen;
    const filteredValue = useMemo(() => filterJsonBySearch(value, searchTerm), [value, searchTerm]);
    const themedStyle = useMemo(
        () => ({
            ...(appliedTheme === "dark" ? githubDarkTheme : githubLightTheme),
            ...(transparentBackground ? { "--w-rjv-background-color": "transparent" } : {}),
            ...(style || {}),
        }),
        [appliedTheme, transparentBackground, style]
    );
    const expandAll = () => {
        setCollapsed(false);
        setViewerKey((k) => k + 1);
    };
    const collapseAll = () => {
        setCollapsed(true);
        setViewerKey((k) => k + 1);
    };
    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(value, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFileName;
        a.click();
        URL.revokeObjectURL(url);
    };
    const viewerContent = (
        <>
            {showToolbarSection && (
                <AppJsonViewerToolbar
                    showSearch={showSearch}
                    showExpandCollapse={showExpandCollapse}
                    showDownload={showDownload}
                    showFullscreen={showFullscreen}
                    searchTerm={searchTerm}
                    searchPlaceholder={searchPlaceholder}
                    isFullscreen={isFullscreen}
                    toolbarClassName={toolbarClassName}
                    onSearchTermChange={setSearchTerm}
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                    onDownload={handleDownload}
                    onToggleFullscreen={() => setIsFullscreen((v) => !v)}
                />
            )}
            <div className={cn("overflow-auto flex-1 px-1 py-1", viewerWrapperClassName)}>
                <JsonView
                    key={viewerKey}
                    value={filteredValue as object}
                    style={themedStyle}
                    collapsed={collapsed}
                    displayDataTypes={displayDataTypes}
                    shortenTextAfterLength={shortenTextAfterLength}
                    {...jsonViewProps}
                >
                    {children}
                </JsonView>
            </div>
            {searchTerm && !hasVisibleResults(filteredValue) && (
                <AppJsonViewerNoResults noResultsText={noResultsText} searchTerm={searchTerm} />
            )}
        </>
    );
    if (isFullscreen && showFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-surface-page flex flex-col">
                <div className="flex-1 min-h-0 p-6 overflow-auto flex items-center justify-center">
                    <div className={cn("h-full w-full mx-20", containerClassName)}>
                        {viewerContent}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div
            className={cn(
                "font-mono text-sm h-full flex flex-col bg-white dark:bg-surface-elevated text-slate-700",
                containerClassName
            )}
        >
            {viewerContent}
        </div>
    );
};

export default AppJsonViewer;
