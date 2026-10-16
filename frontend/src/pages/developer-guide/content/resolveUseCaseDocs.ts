import {
    stripMarkdownOnThisPage,
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";
import { labelToSlug } from "../utils";

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

/** `x-docs` is shared across all use cases under a spec (resolved once from the
 * domain's `./docs` directory) — there's no per-use-case field in the spec data
 * itself. Scoping instead relies on a filename convention in `automation-specifications`:
 * a doc belongs to a use case's Additional Resources tab when its slug is
 * `<usecase-slug>-resources-<anything>` (e.g. `personal-loan-resources-01-kfsdoc`
 * for the "Personal Loan" use case). The numeric segment controls display order —
 * matches are sorted by slug. A use case with no matching docs gets no tab at all. */
const ADDITIONAL_RESOURCES_MARKER = "-resources-";

function isAdditionalResourcesSlug(slug: string): boolean {
    return slug.toLowerCase().includes(ADDITIONAL_RESOURCES_MARKER);
}

/** Resolve the "Additional Resources" docs from API spec data for the given use case
 * (e.g. `apiUsecase ?? slug`) — see `ADDITIONAL_RESOURCES_MARKER` for the naming
 * convention that scopes and orders these. Returned keys have the
 * `<usecase-slug>-resources-<n>-` prefix stripped for display. */
export function resolveAdditionalResourcesDocs(
    apiDocs: Record<string, string> | undefined,
    useCaseId: string | undefined
): Record<string, string> | undefined {
    if (!apiDocs || !useCaseId) return undefined;

    const prefix = `${labelToSlug(useCaseId)}${ADDITIONAL_RESOURCES_MARKER}`;

    const matches = Object.entries(apiDocs)
        .filter(([slug]) => slug.toLowerCase().startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b));
    if (matches.length === 0) return undefined;

    return Object.fromEntries(
        matches.map(([slug, content]) => {
            const displaySlug = slug.slice(prefix.length).replace(/^\d+-/, "") || slug;
            return [displaySlug, prepareDocContent(content)];
        })
    );
}

export { isAdditionalResourcesSlug };
