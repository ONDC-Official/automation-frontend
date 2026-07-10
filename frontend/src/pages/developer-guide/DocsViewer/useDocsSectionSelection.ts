import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { scrollToSectionWithOffset } from "@components/TableOfContents/scrollToSection";
import { extractMarkdownToc } from "@utils/markdownToc";

const TOC_TOP = 100;

interface UseDocsSectionSelectionParams {
    docSlugs: string[];
    docs: Record<string, string>;
}

export function useDocsSectionSelection({ docSlugs, docs }: UseDocsSectionSelectionParams) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { hash } = useLocation();

    const defaultDocSlug = docSlugs[0] ?? "";
    const urlDocSlug = searchParams.get("doc");
    const activeDocSlug = useMemo(() => {
        if (urlDocSlug && docSlugs.includes(urlDocSlug)) return urlDocSlug;
        return defaultDocSlug;
    }, [urlDocSlug, docSlugs, defaultDocSlug]);

    const content = docs[activeDocSlug] ?? "";

    const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(
        () => searchParams.get("attr") ?? (hash ? hash.slice(1) : null)
    );

    const commentsPanelOpen = searchParams.get("panel") === "comments";
    const [rightPanelOpen, setRightPanelOpenState] = useState(commentsPanelOpen);

    const toc = useMemo(() => extractMarkdownToc(content), [content]);

    const selectedSectionLabel = useMemo(() => {
        if (!selectedSectionId) return undefined;
        return toc.find((entry) => entry.id === selectedSectionId)?.text;
    }, [selectedSectionId, toc]);

    // Keep doc param in sync with active slug
    useEffect(() => {
        if (!activeDocSlug) return;
        setSearchParams(
            (prev) => {
                if (prev.get("doc") === activeDocSlug) return prev;
                const next = new URLSearchParams(prev);
                next.set("doc", activeDocSlug);
                return next;
            },
            { replace: true }
        );
    }, [activeDocSlug, setSearchParams]);

    // Scroll to hash on mount / hash change
    useEffect(() => {
        if (!hash) return;
        const id = hash.slice(1);
        const frame = requestAnimationFrame(() => {
            scrollToSectionWithOffset(id, TOC_TOP);
        });
        return () => cancelAnimationFrame(frame);
    }, [hash, content]);

    // Sync attr from hash when hash changes
    useEffect(() => {
        if (!hash) return;
        const id = hash.slice(1);
        setSelectedSectionIdState(id);
        setSearchParams(
            (prev) => {
                if (prev.get("attr") === id) return prev;
                const next = new URLSearchParams(prev);
                next.set("attr", id);
                return next;
            },
            { replace: true }
        );
    }, [hash, setSearchParams]);

    // Scroll to attr on content load when attr is set without hash
    useEffect(() => {
        const attr = searchParams.get("attr");
        if (!attr || hash) return;
        const frame = requestAnimationFrame(() => {
            scrollToSectionWithOffset(attr, TOC_TOP);
        });
        return () => cancelAnimationFrame(frame);
    }, [content, hash, searchParams]);

    const setActiveDocSlug = useCallback(
        (slug: string) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("doc", slug);
                    next.delete("attr");
                    return next;
                },
                { replace: true }
            );
            setSelectedSectionIdState(null);
        },
        [setSearchParams]
    );

    const selectSection = useCallback(
        (sectionId: string) => {
            setSelectedSectionIdState(sectionId);
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("attr", sectionId);
                    return next;
                },
                { replace: true }
            );
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}#${sectionId}`
            );
            scrollToSectionWithOffset(sectionId, TOC_TOP);
        },
        [setSearchParams]
    );

    const setRightPanelOpen = useCallback(
        (open: boolean) => {
            setRightPanelOpenState(open);
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (open) next.set("panel", "comments");
                    else next.delete("panel");
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    // Open panel when panel=comments is in URL
    useEffect(() => {
        setRightPanelOpenState(commentsPanelOpen);
    }, [commentsPanelOpen]);

    return {
        activeDocSlug,
        setActiveDocSlug,
        selectedSectionId,
        selectedSectionLabel,
        selectSection,
        rightPanelOpen,
        setRightPanelOpen,
        toc,
        tocOffset: TOC_TOP,
    };
}
