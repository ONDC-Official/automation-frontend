import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { scrollToSectionWithOffset } from "@components/TableOfContents/scrollToSection";
import { extractMarkdownToc } from "@utils/markdownToc";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setCommentsPanelOpen } from "@store/slices/devGuideShellSlice";

const TOC_TOP = 100;

interface UseDocsSectionSelectionParams {
    docSlugs: string[];
    docs: Record<string, string>;
}

export function useDocsSectionSelection({ docSlugs, docs }: UseDocsSectionSelectionParams) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { hash } = useLocation();

    // react-router's `setSearchParams`/`navigate` are recreated whenever the location changes
    // (they close over the current value), so a `useCallback` that lists them as deps gets a new
    // identity on every navigation — including the ones these callbacks themselves trigger. Route
    // calls through refs so `selectSection`/`setActiveDocSlug` stay referentially stable.
    const setSearchParamsRef = useRef(setSearchParams);
    setSearchParamsRef.current = setSearchParams;

    const navigate = useNavigate();
    const navigateRef = useRef(navigate);
    navigateRef.current = navigate;

    // Only multi-doc surfaces (e.g. DocsViewer's domain tabs) need a `doc` query param to say
    // which tab is active; single-doc pages already get that from the route's `:slug`.
    const isMultiDoc = docSlugs.length > 1;
    const defaultDocSlug = docSlugs[0] ?? "";
    const urlDocSlug = searchParams.get("doc");
    const activeDocSlug = useMemo(() => {
        if (isMultiDoc && urlDocSlug && docSlugs.includes(urlDocSlug)) return urlDocSlug;
        return defaultDocSlug;
    }, [isMultiDoc, urlDocSlug, docSlugs, defaultDocSlug]);

    const content = docs[activeDocSlug] ?? "";

    // The selected section is just the URL hash — no separate `attr` query param. Keeping two
    // representations of "which section is selected" in sync was the source of the visible
    // jump/flicker on every heading click; the hash alone is exactly what preprod uses.
    const selectedSectionId = hash ? hash.slice(1) : null;

    const dispatch = useAppDispatch();
    const rightPanelOpen = useAppSelector((state) => state.devGuideShell.commentsPanelOpen);

    const toc = useMemo(() => extractMarkdownToc(content), [content]);

    const selectedSectionLabel = useMemo(() => {
        if (!selectedSectionId) return undefined;
        return toc.find((entry) => entry.id === selectedSectionId)?.text;
    }, [selectedSectionId, toc]);

    // Keep doc param in sync with active slug (multi-doc surfaces only)
    useEffect(() => {
        if (!isMultiDoc || !activeDocSlug) return;
        setSearchParams(
            (prev) => {
                if (prev.get("doc") === activeDocSlug) return prev;
                const next = new URLSearchParams(prev);
                next.set("doc", activeDocSlug);
                return next;
            },
            { replace: true }
        );
    }, [isMultiDoc, activeDocSlug, setSearchParams]);

    // Scroll to hash on mount / hash change
    useEffect(() => {
        if (!hash) return;
        const id = hash.slice(1);
        const frame = requestAnimationFrame(() => {
            scrollToSectionWithOffset(id, TOC_TOP);
        });
        return () => cancelAnimationFrame(frame);
    }, [hash, content]);

    const setActiveDocSlug = useCallback((slug: string) => {
        setSearchParamsRef.current(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("doc", slug);
                return next;
            },
            { replace: true }
        );
    }, []);

    const selectSection = useCallback((sectionId: string) => {
        navigateRef.current(
            {
                pathname: window.location.pathname,
                search: window.location.search,
                hash: `#${sectionId}`,
            },
            { replace: true }
        );
        scrollToSectionWithOffset(sectionId, TOC_TOP, true);
    }, []);

    const setRightPanelOpen = useCallback(
        (open: boolean) => {
            dispatch(setCommentsPanelOpen(open));
        },
        [dispatch]
    );

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
