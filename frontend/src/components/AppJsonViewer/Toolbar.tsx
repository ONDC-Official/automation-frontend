import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import SearchField from "@components/Shadcn/SearchField";
import { cn } from "@/lib/utils";

type ToolbarProps = {
    showSearch: boolean;
    showExpandCollapse: boolean;
    showDownload: boolean;
    showFullscreen: boolean;
    searchTerm: string;
    searchPlaceholder: string;
    isFullscreen: boolean;
    invertTheme?: boolean;
    toolbarClassName?: string;
    onSearchTermChange: (value: string) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onDownload: () => void;
    onToggleFullscreen: () => void;
};

const AppJsonViewerToolbar = ({
    showSearch,
    showExpandCollapse,
    showDownload,
    showFullscreen,
    searchTerm,
    searchPlaceholder,
    isFullscreen,
    invertTheme = false,
    toolbarClassName,
    onSearchTermChange,
    onExpandAll,
    onCollapseAll,
    onDownload,
    onToggleFullscreen,
}: ToolbarProps) => {
    // Fullscreen keeps search pinned left (growing with available space, for comfortable
    // typing) and the action buttons pinned right via `ml-auto`, wrapping onto their own row
    // instead of clipping when the viewport is too narrow to fit everything on one line — the
    // embedded toolbar keeps its original compact, left-packed, non-wrapping layout untouched.
    const controlSize = isFullscreen ? "default" : "sm";
    const iconSize = isFullscreen ? "icon" : "icon-sm";

    return (
        <div
            className={cn(
                "flex items-center border-b backdrop-blur-xs",
                isFullscreen
                    ? "flex-wrap gap-x-3 gap-y-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5"
                    : "gap-2 px-4 py-2.5 overflow-x-auto",
                invertTheme
                    ? "border-gray-700 bg-gray-800"
                    : "border-slate-200 bg-brand-light dark:bg-surface-elevated/90",
                toolbarClassName
            )}
        >
            {showSearch && (
                <SearchField
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    containerClassName={cn(
                        isFullscreen ? "flex-1 min-w-[180px] max-w-md" : "w-44 shrink-0"
                    )}
                    className={cn(
                        "font-mono",
                        isFullscreen ? "h-9 text-[13px]" : "h-8 text-[12px]",
                        invertTheme &&
                            "bg-gray-900! border-gray-700! text-gray-100! placeholder:text-gray-500!"
                    )}
                />
            )}
            {showExpandCollapse && (
                <>
                    <Button variant="outline" size={controlSize} onClick={onExpandAll}>
                        Expand All
                    </Button>
                    <Button variant="outline" size={controlSize} onClick={onCollapseAll}>
                        Collapse All
                    </Button>
                </>
            )}
            {(showDownload || showFullscreen) && (
                <div
                    className={cn(
                        "flex items-center shrink-0 border-l",
                        isFullscreen ? "gap-2 pl-4 ml-auto" : "gap-1.5 pl-2",
                        invertTheme ? "border-gray-700" : "border-slate-200",
                        isFullscreen && !invertTheme && "dark:border-border-default"
                    )}
                >
                    {showDownload && (
                        <Button size={controlSize} onClick={onDownload}>
                            Download
                        </Button>
                    )}
                    {showFullscreen && (
                        <Button
                            type="button"
                            variant="ghost"
                            size={iconSize}
                            onClick={onToggleFullscreen}
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="size-4" />
                            ) : (
                                <ArrowsPointingOutIcon className="size-4" />
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppJsonViewerToolbar;
