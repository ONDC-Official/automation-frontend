import { useEffect, useRef, useState, type ReactNode } from "react";
import {
    ArrowDownTrayIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    ChevronDoubleDownIcon,
    ChevronDoubleUpIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@components/Shadcn/Button";
import SearchField from "@components/Shadcn/SearchField";
import { TooltipHint } from "@components/Shadcn/Tooltip";
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
    toolbarEnd?: ReactNode;
    onSearchTermChange: (value: string) => void;
    isFullyExpanded: boolean;
    onToggleExpandCollapse: () => void;
    onDownload: () => void;
    onToggleFullscreen: () => void;
};

/** Collapsed = icon slot only (32px). Expanded grows to the right of that slot. */
const SEARCH_COLLAPSED_PX = 32;
const SEARCH_EXPANDED_PX = 208;

/** Soft hover on brand-light toolbar — dark icons lighten on hover. */
const toolbarIconClass =
    "text-slate-700 hover:bg-white/70 dark:text-n-20 dark:hover:bg-surface-muted dark:hover:text-n-60";

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
    toolbarEnd,
    onSearchTermChange,
    isFullyExpanded,
    onToggleExpandCollapse,
    onDownload,
    onToggleFullscreen,
}: ToolbarProps) => {
    // Fullscreen keeps search expanded by default for comfortable typing; the
    // embedded toolbar starts collapsed as an icon and expands on click.
    const [searchOpen, setSearchOpen] = useState(isFullscreen);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isSearchExpanded = isFullscreen || searchOpen || Boolean(searchTerm);
    const iconSize = isFullscreen ? "icon" : "icon-sm";

    useEffect(() => {
        if (!isSearchExpanded || isFullscreen) return;
        const id = requestAnimationFrame(() => searchInputRef.current?.focus());
        return () => cancelAnimationFrame(id);
    }, [isSearchExpanded, isFullscreen]);

    const collapseSearchIfEmpty = () => {
        if (!searchTerm && !isFullscreen) setSearchOpen(false);
    };

    return (
        <div
            className={cn(
                "flex items-center justify-between gap-2 border-b backdrop-blur-xs",
                isFullscreen ? "px-4 py-3 sm:px-6 sm:py-3.5" : "px-4 py-2.5",
                invertTheme
                    ? "border-gray-700 bg-gray-800"
                    : "border-slate-200 bg-brand-light dark:bg-surface-elevated/90",
                toolbarClassName
            )}
        >
            <div className="flex min-w-0 items-center">
                {showSearch &&
                    (isFullscreen ? (
                        <SearchField
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            containerClassName="min-w-0! w-full max-w-md"
                            className={cn(
                                "h-9 font-mono text-[13px]",
                                invertTheme &&
                                    "bg-gray-900! border-gray-700! text-gray-100! placeholder:text-gray-500!"
                            )}
                        />
                    ) : (
                        <div
                            className={cn(
                                "relative flex h-8 items-center overflow-hidden rounded-md border transition-[width,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                                isSearchExpanded
                                    ? "border-n-40 bg-white dark:border-border-default dark:bg-surface-muted"
                                    : "border-transparent bg-transparent"
                            )}
                            style={{
                                width: isSearchExpanded ? SEARCH_EXPANDED_PX : SEARCH_COLLAPSED_PX,
                            }}
                        >
                            {isSearchExpanded ? (
                                <>
                                    <MagnifyingGlassIcon
                                        className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-n-80 dark:text-n-60"
                                        aria-hidden
                                    />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => onSearchTermChange(e.target.value)}
                                        onBlur={collapseSearchIfEmpty}
                                        onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                                if (searchTerm) onSearchTermChange("");
                                                else {
                                                    setSearchOpen(false);
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }
                                        }}
                                        placeholder={searchPlaceholder}
                                        aria-label={searchPlaceholder}
                                        className="h-full w-full min-w-0 bg-transparent py-0 pl-8 pr-3 font-mono text-[12px] text-n-700 outline-none placeholder:text-n-80 dark:text-n-20"
                                    />
                                </>
                            ) : (
                                <TooltipHint content="Search" side="bottom">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size={iconSize}
                                        aria-label="Open search"
                                        className={toolbarIconClass}
                                        onClick={() => setSearchOpen(true)}
                                    >
                                        <MagnifyingGlassIcon className="size-4" />
                                    </Button>
                                </TooltipHint>
                            )}
                        </div>
                    ))}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                {showExpandCollapse && (
                    <TooltipHint
                        content={isFullyExpanded ? "Collapse All" : "Expand All"}
                        side="bottom"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size={iconSize}
                            aria-label={isFullyExpanded ? "Collapse All" : "Expand All"}
                            className={toolbarIconClass}
                            onClick={onToggleExpandCollapse}
                        >
                            {isFullyExpanded ? (
                                <ChevronDoubleUpIcon className="size-4" />
                            ) : (
                                <ChevronDoubleDownIcon className="size-4" />
                            )}
                        </Button>
                    </TooltipHint>
                )}
                {showDownload && (
                    <TooltipHint content="Download" side="bottom">
                        <Button
                            type="button"
                            variant="ghost"
                            size={iconSize}
                            aria-label="Download"
                            className={toolbarIconClass}
                            onClick={onDownload}
                        >
                            <ArrowDownTrayIcon className="size-4" />
                        </Button>
                    </TooltipHint>
                )}
                {showFullscreen && (
                    <TooltipHint
                        content={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        side="bottom"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size={iconSize}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            className={toolbarIconClass}
                            onClick={onToggleFullscreen}
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="size-4" />
                            ) : (
                                <ArrowsPointingOutIcon className="size-4" />
                            )}
                        </Button>
                    </TooltipHint>
                )}
                {toolbarEnd}
            </div>
        </div>
    );
};

export default AppJsonViewerToolbar;
