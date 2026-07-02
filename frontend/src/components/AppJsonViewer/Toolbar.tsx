import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/Shadcn/Button/button";
import SearchField from "@/components/Shadcn/SearchField";
import { cn } from "@/lib/utils";

type ToolbarProps = {
    showSearch: boolean;
    showExpandCollapse: boolean;
    showDownload: boolean;
    showFullscreen: boolean;
    searchTerm: string;
    searchPlaceholder: string;
    isFullscreen: boolean;
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
    toolbarClassName,
    onSearchTermChange,
    onExpandAll,
    onCollapseAll,
    onDownload,
    onToggleFullscreen,
}: ToolbarProps) => (
    <div
        className={cn(
            "flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-brand-light dark:bg-surface-elevated/90 backdrop-blur-xs overflow-x-auto",
            toolbarClassName
        )}
    >
        {showSearch && (
            <SearchField
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                placeholder={searchPlaceholder}
                containerClassName="w-44 shrink-0"
                className="h-8 text-[12px] font-mono"
            />
        )}
        {showExpandCollapse && (
            <>
                <Button variant="outline" size="sm" onClick={onExpandAll}>
                    Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={onCollapseAll}>
                    Collapse All
                </Button>
            </>
        )}
        {(showDownload || showFullscreen) && (
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
                {showDownload && (
                    <Button size="sm" onClick={onDownload}>
                        Download
                    </Button>
                )}
                {showFullscreen && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
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

export default AppJsonViewerToolbar;
