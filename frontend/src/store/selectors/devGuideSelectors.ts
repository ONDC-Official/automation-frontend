import { useMemo } from "react";
import { useGetBuildsQuery } from "@store/api";
import {
    useGetGithubDocListQuery,
    useGetGithubSidebarDocContentsQuery,
} from "@store/api/githubDocs";
import { buildNavTree } from "@pages/developer-guide/layout/buildNavTree";
import { DOCS_WITH_SIDEBAR_SECTIONS } from "@pages/developer-guide/layout/docsWithSidebarSections";
import { isUseCaseEnabled } from "@pages/developer-guide/utils";
import type { BuildEntry, DocMeta, NavNode } from "@/types/apiShared/developerGuide";

// Stable empty references so the memo hooks below don't invalidate on every render when a query
// has no data yet (a fresh `?? []` / `?? {}` would be a new reference each time).
const EMPTY_BUILDS: BuildEntry[] = [];
const EMPTY_DOCS: DocMeta[] = [];
const EMPTY_MARKDOWN: Record<string, string> = {};

// `buildNavTree` is expensive (markdown TOC parsing, sorting, tree mapping) and its inputs are
// stable references from the RTK Query cache. Memoize a single result across ALL consumers and
// renders so the tree is computed once per data change, not once per component instance — several
// components (notably each `NavLinkItem`) read the nav tree.
let navCacheBuilds: BuildEntry[] | null = null;
let navCacheDocs: DocMeta[] | null = null;
let navCacheMarkdown: Record<string, string> | null = null;
let navCacheValue: NavNode[] = [];

function computeNavTree(
    builds: BuildEntry[],
    docs: DocMeta[],
    markdown: Record<string, string>
): NavNode[] {
    if (navCacheBuilds === builds && navCacheDocs === docs && navCacheMarkdown === markdown) {
        return navCacheValue;
    }
    navCacheValue = buildNavTree(builds, docs, isUseCaseEnabled, markdown);
    navCacheBuilds = builds;
    navCacheDocs = docs;
    navCacheMarkdown = markdown;
    return navCacheValue;
}

/** Builds, docs, and nav tree from RTK Query caches — no Redux duplication. */
export function useDevGuideShellServerState() {
    const buildsQuery = useGetBuildsQuery();
    const docsQuery = useGetGithubDocListQuery();

    const docs = docsQuery.data ?? EMPTY_DOCS;
    const builds = buildsQuery.data ?? EMPTY_BUILDS;

    const sidebarSlugs = useMemo(
        () => docs.map((doc) => doc.slug).filter((slug) => DOCS_WITH_SIDEBAR_SECTIONS.has(slug)),
        [docs]
    );

    const sidebarContentsQuery = useGetGithubSidebarDocContentsQuery(sidebarSlugs, {
        skip: sidebarSlugs.length === 0,
    });

    const docMarkdownBySlug = sidebarContentsQuery.data ?? EMPTY_MARKDOWN;

    const navTree = useMemo(
        () => computeNavTree(builds, docs, docMarkdownBySlug),
        [builds, docs, docMarkdownBySlug]
    );

    // Block shell only on builds (required). GitHub docs are best-effort — matches the old
    // fetchDocList().catch(() => []) behavior so a slow/blocked GitHub API cannot brick the guide.
    const isLoading = buildsQuery.isLoading;

    const loadError = buildsQuery.isError
        ? "Unable to load navigation. Please try again later."
        : null;

    const isNavEnriching =
        docsQuery.isFetching || (sidebarSlugs.length > 0 && sidebarContentsQuery.isFetching);

    return {
        builds,
        docs,
        navTree,
        isLoading,
        loadError,
        isNavEnriching,
    };
}
