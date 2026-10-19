import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from "react";
import { createPortal } from "react-dom";
import GithubMarkdown from "@components/GithubMarkdown";
import { scrollToSectionWithOffset } from "@components/TableOfContents/scrollToSection";
import { Button } from "@components/Shadcn/Button";
import { cn } from "@/lib/utils";
import {
    extractMarkdownToc,
    slugifyHeading,
    stripHeadingNumberPrefix,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";

interface AdditionalResourcesViewProps {
    docs: Record<string, string>;
}

const TOC_TOP = 100;
const MAX_SECTIONS_PER_DOC = 2;

interface TocDoc {
    slug: string;
    anchorId: string;
    sections: { id: string; text: string }[];
}

function extractH1Id(markdown: string): string | null {
    const line = markdown
        .split("\n")
        .find((l) => /^#\s+\S/.test(l.trim()) && !/^##/.test(l.trim()));
    if (!line) return null;
    const text = line.trim().replace(/^#\s+/, "");
    return slugifyHeading(text);
}

/**
 * Renders the "Additional Resources" docs — reference links and supplementary
 * material kept out of the Use Case Brief tab — as sections of one single page,
 * in the order given by `docs` (see `resolveAdditionalResourcesDocs`), rather than
 * as separate tabs.
 */
const AdditionalResourcesView: FC<AdditionalResourcesViewProps> = ({ docs }) => {
    const slugs = useMemo(() => Object.keys(docs), [docs]);
    const [activeId, setActiveId] = useState("");
    const anchorRef = useRef<HTMLDivElement>(null);

    const [pin, setPin] = useState<{ left: number; width: number; naturalTop: number } | null>(
        null
    );
    const [pinned, setPinned] = useState(false);

    const measure = () => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();

        const naturalTop = rect.top + window.scrollY;
        setPin({ left: rect.left, width: rect.width, naturalTop });
        setPinned(window.scrollY + TOC_TOP >= naturalTop);
    };

    useLayoutEffect(() => {
        measure();
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("scroll", measure);
            window.removeEventListener("resize", measure);
        };
    }, [slugs]);
    useEffect(() => {
        if (!pinned) return;
        let frame: number;
        const tick = () => {
            measure();
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [pinned]);

    const tocDocs: TocDoc[] = useMemo(
        () =>
            slugs.map((slug) => {
                const content = docs[slug] ?? "";
                const sections = extractMarkdownToc(content)
                    .filter((entry) => entry.level === 2)
                    .slice(0, MAX_SECTIONS_PER_DOC);
                return {
                    slug,
                    anchorId: extractH1Id(content) ?? slug,
                    sections,
                };
            }),
        [slugs, docs]
    );

    if (slugs.length === 0) return null;

    const handleSectionClick = (id: string) => {
        setActiveId(id);
        scrollToSectionWithOffset(id, TOC_TOP, true);
    };

    const tocList = (
        <TocList docs={tocDocs} activeId={activeId} onSectionClick={handleSectionClick} />
    );

    return (
        <div className="flex flex-col gap-3 py-6">
            <div className="flex items-start gap-6">
                <div className="min-h-[60vh] flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-border-default bg-white dark:bg-surface-elevated p-4 flex flex-col gap-10">
                    {slugs.map((slug) => {
                        const displayContent = stripRedundantMarkdownHorizontalRules(
                            docs[slug] ?? ""
                        );
                        return (
                            <section key={slug}>
                                <GithubMarkdown content={displayContent} />
                            </section>
                        );
                    })}
                </div>

                {tocDocs.length > 0 && (
                    <div ref={anchorRef} className="hidden lg:block w-64 shrink-0 self-start">
                        {/* Reserves the column's width/space in normal flow; hidden once
                            pinned so the portal copy below is the only one visible. */}
                        <div className={pinned ? "invisible" : undefined}>{tocList}</div>
                    </div>
                )}
            </div>

            {pinned &&
                pin &&
                tocDocs.length > 0 &&
                createPortal(
                    <div
                        className="hidden lg:block fixed overflow-y-auto"
                        style={{
                            top: TOC_TOP,
                            left: pin.left,
                            width: pin.width,
                            maxHeight: `calc(100vh - ${TOC_TOP}px)`,
                        }}
                    >
                        {tocList}
                    </div>,
                    document.body
                )}
        </div>
    );
};

interface TocListProps {
    docs: TocDoc[];
    activeId: string;
    onSectionClick: (id: string) => void;
}

const TocList: FC<TocListProps> = ({ docs, activeId, onSectionClick }) => (
    <>
        <span className="block px-3 pb-2 text-[12px] font-bold text-slate-700 dark:text-n-20 uppercase tracking-widest">
            On this page
        </span>
        <nav className="space-y-px">
            {docs.map(({ slug, anchorId, sections }) => (
                <div key={slug}>
                    <SectionLink
                        id={anchorId}
                        text={slug}
                        isActive={activeId === anchorId}
                        onClick={onSectionClick}
                    />
                    {sections.map((section) => (
                        <SectionLink
                            key={section.id}
                            id={section.id}
                            text={stripHeadingNumberPrefix(section.text)}
                            isActive={activeId === section.id}
                            onClick={onSectionClick}
                            indent
                        />
                    ))}
                </div>
            ))}
        </nav>
    </>
);

interface SectionLinkProps {
    id: string;
    text: string;
    isActive: boolean;
    indent?: boolean;
    onClick: (id: string) => void;
}

const SectionLink: FC<SectionLinkProps> = ({ id, text, isActive, indent, onClick }) => (
    <div className="relative flex items-start">
        {isActive && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sky-500" />
        )}
        <Button
            type="button"
            variant="ghost"
            onClick={() => onClick(id)}
            title={text}
            className={cn(
                "h-auto flex-1 justify-start text-left text-sm leading-snug font-normal rounded py-1.5 pr-2 transition-colors truncate",
                indent ? "pl-5" : "pl-3",
                isActive
                    ? "bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300 font-semibold"
                    : "text-slate-600 dark:text-n-30 hover:bg-slate-100 dark:hover:bg-surface-muted hover:text-slate-900 dark:hover:text-n-10"
            )}
        >
            {text}
        </Button>
    </div>
);

export default AdditionalResourcesView;
