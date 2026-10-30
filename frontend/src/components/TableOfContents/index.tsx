import { type FC, useEffect, useMemo, useState } from "react";
import { extractMarkdownToc } from "@utils/markdownToc";
import { scrollToSectionWithOffset } from "./scrollToSection";
import { Button } from "@/components/Shadcn/Button";

interface TableOfContentsProps {
    content: string;
    /** Optional extra class on the outer wrapper (e.g. sticky + top offset) */
    className?: string;
    /** Inline style on the outer wrapper (e.g. { top: 128 } for sticky offset) */
    style?: React.CSSProperties;
    /**
     * Height (px) of any sticky header/breadcrumb the page content scrolls under.
     * When set, clicking an entry scrolls just enough to clear that sticky area
     * instead of pulling the section to the absolute top of the viewport.
     */
    offset?: number;
    /** When provided, called on section click (parent handles scroll/URL). */
    onSectionClick?: (id: string) => void;
    /** Externally controlled active section id. */
    activeSectionId?: string | null;
    /** When true, only show the main/top-level headings (level 2) */
    mainHeadingsOnly?: boolean;
}

const TableOfContents: FC<TableOfContentsProps> = ({
    content,
    className,
    style,
    offset = 0,
    onSectionClick,
    activeSectionId,
    mainHeadingsOnly = false,
}) => {
    const toc = useMemo(() => {
        const entries = extractMarkdownToc(content);
        if (!mainHeadingsOnly) return entries;
        const hasH2 = entries.some((e) => e.level === 2);
        return hasH2 ? entries.filter((e) => e.level === 2) : entries;
    }, [content, mainHeadingsOnly]);

    const [activeId, setActiveId] = useState("");

    // Active heading scroll spy via IntersectionObserver
    useEffect(() => {
        if (toc.length === 0) return;

        const headingElements = toc
            .map((entry) => document.getElementById(entry.id))
            .filter((el): el is HTMLElement => el !== null);

        if (headingElements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (intersecting.length > 0) {
                    setActiveId(intersecting[0].target.id);
                }
            },
            {
                rootMargin: `-${offset || 80}px 0px -60% 0px`,
                threshold: 0,
            }
        );

        headingElements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [toc, offset]);

    if (toc.length === 0) return null;

    const handleClick = (id: string) => {
        setActiveId(id);
        if (onSectionClick) {
            onSectionClick(id);
            return;
        }
        if (offset > 0) {
            scrollToSectionWithOffset(id, offset);
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };

    const resolvedActiveId = activeSectionId || activeId;

    return (
        <div className={className} style={style}>
            <div className="bg-white dark:bg-surface-elevated rounded-xl border border-slate-300 dark:border-border-default shadow-xs overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2 bg-slate-100 dark:bg-surface-muted border-b border-slate-200 dark:border-border-default">
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        On this page
                    </span>
                </div>

                {/* Nav */}
                <nav className="p-1.5 space-y-px max-h-[70vh] overflow-y-auto">
                    {toc.map((entry) => {
                        const isActive = resolvedActiveId === entry.id;
                        return (
                            <div key={entry.id} className="relative flex items-start">
                                {/* Active accent bar */}
                                {isActive && (
                                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-500" />
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => handleClick(entry.id)}
                                    title={entry.text}
                                    className={[
                                        "h-auto flex-1 justify-start text-left text-sm leading-snug font-normal rounded py-1.5 pr-2 transition-colors truncate",
                                        entry.level === 3 ? "pl-5 text-xs text-slate-500 dark:text-slate-400" : "pl-3",
                                        isActive
                                            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-semibold"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-muted hover:text-slate-900 dark:hover:text-slate-100",
                                    ].join(" ")}
                                >
                                    {entry.text}
                                </Button>
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default TableOfContents;
