import {
    stripMarkdownOnThisPage,
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";

function prepareDocContent(markdown: string): string {
    return stripRedundantMarkdownHorizontalRules(
        stripMarkdownOnThisPage(stripMarkdownTableOfContents(markdown))
    );
}

/** Resolve use-case documentation from API spec data. */
export function resolveUseCaseDocs(
    apiDocs: Record<string, string> | undefined
): Record<string, string> | undefined {
    if (!apiDocs) return undefined;

    return Object.fromEntries(
        Object.entries(apiDocs).map(([slug, content]) => [slug, prepareDocContent(content)])
    );
}
