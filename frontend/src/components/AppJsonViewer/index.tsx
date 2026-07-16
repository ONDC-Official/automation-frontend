import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { useAppliedTheme } from "@/theme/hooks/useAppliedTheme";
import { cn } from "@/lib/utils";
import { AppJsonViewerProps } from "@components/AppJsonViewer/types";
import { filterJsonBySearch, hasVisibleResults } from "@components/AppJsonViewer/utils";
import AppJsonViewerToolbar from "@components/AppJsonViewer/Toolbar";
import AppJsonViewerNoResults from "@components/AppJsonViewer/NoResults";

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
    invertTheme = false,
    style,
    displayDataTypes = false,
    shortenTextAfterLength = 0,
    containerClassName,
    toolbarClassName,
    viewerWrapperClassName,
    ...jsonViewProps
}: AppJsonViewerProps) => {
    const appliedTheme = useAppliedTheme();
    // When inverted, the viewer follows the opposite of the app theme so it
    // aligns with panels that flip via the aliased gray/slate palette.
    const effectiveTheme = invertTheme
        ? appliedTheme === "dark"
            ? "light"
            : "dark"
        : appliedTheme;
    const [searchTerm, setSearchTerm] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const [viewerKey, setViewerKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Portaled to body (or the fullscreen element) so ancestor transforms — e.g. PageReveal's
    // `page-reveal-child` — cannot turn `position: fixed` into a content-area-relative overlay
    // that leaves the app header / breadcrumbs uncovered. Same pattern as LoadingOverlay.
    const [portalTarget, setPortalTarget] = useState<Element>(
        () => document.fullscreenElement ?? document.body
    );
    useEffect(() => {
        if (!isFullscreen) return;
        const update = () => setPortalTarget(document.fullscreenElement ?? document.body);
        update();
        document.addEventListener("fullscreenchange", update);
        return () => document.removeEventListener("fullscreenchange", update);
    }, [isFullscreen]);
    const showToolbarSection =
        showToolbar || showSearch || showExpandCollapse || showDownload || showFullscreen;
    const filteredValue = useMemo(() => filterJsonBySearch(value, searchTerm), [value, searchTerm]);
    const themedStyle = useMemo(
        () => ({
            ...(effectiveTheme === "dark" ? githubDarkTheme : githubLightTheme),
            ...(transparentBackground ? { "--w-rjv-background-color": "transparent" } : {}),
            // Fullscreen gets slightly larger type + line-height for large-display readability;
            // embedded is untouched since this spreads an empty object when isFullscreen is false.
            ...(isFullscreen ? { fontSize: 14, lineHeight: 1.6 } : {}),
            ...(style || {}),
        }),
        [effectiveTheme, transparentBackground, isFullscreen, style]
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
                    invertTheme={invertTheme}
                    toolbarClassName={toolbarClassName}
                    onSearchTermChange={setSearchTerm}
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                    onDownload={handleDownload}
                    onToggleFullscreen={() => setIsFullscreen((v) => !v)}
                />
            )}
            <div
                className={cn(
                    "flex-1 overflow-auto",
                    isFullscreen ? "px-6 py-5" : "px-1 py-1",
                    viewerWrapperClassName
                )}
            >
                <JsonView
                    key={viewerKey}
                    value={filteredValue as object}
                    style={themedStyle}
                    collapsed={collapsed}
                    displayDataTypes={displayDataTypes}
                    shortenTextAfterLength={shortenTextAfterLength}
                    indentWidth={isFullscreen ? 22 : undefined}
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
        return createPortal(
            <div
                data-reveal-skip
                className="fixed inset-0 z-50 bg-slate-100 dark:bg-surface-page flex flex-col"
            >
                <div className="flex-1 min-h-0 flex justify-center overflow-hidden p-5">
                    <div
                        className={cn(
                            "flex h-full w-full max-w-[1800px] flex-col overflow-hidden rounded-xl border shadow-2xl",
                            invertTheme
                                ? "border-gray-700 bg-gray-900 text-gray-100"
                                : "border-slate-200 bg-white text-slate-700 dark:border-border-default dark:bg-surface-elevated",
                            containerClassName
                        )}
                    >
                        {viewerContent}
                    </div>
                </div>
            </div>,
            portalTarget
        );
    }
    return (
        <div
            className={cn(
                "font-mono text-sm h-full flex flex-col",
                invertTheme
                    ? "bg-gray-900 text-gray-100"
                    : "bg-white dark:bg-surface-elevated text-slate-700",
                containerClassName
            )}
        >
            {viewerContent}
        </div>
    );
};

export default AppJsonViewer;
