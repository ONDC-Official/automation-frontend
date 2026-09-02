import {
    stripMarkdownTableOfContents,
    stripRedundantMarkdownHorizontalRules,
} from "@utils/markdownToc";
import personalLoansRaw from "./personal-loans.md?raw";

const PERSONAL_LOANS_DOC_SLUG = "use-case-brief";

function normalizeUseCase(value: string): string {
    return value.toLowerCase().replace(/[\s_-]+/g, "-");
}

function stripOnThisPage(markdown: string): string {
    const lines = markdown.split("\n");
    const startIdx = lines.findIndex((line) => /^##\s+on this page\s*$/i.test(line.trim()));
    if (startIdx === -1) return markdown;

    let endIdx = startIdx + 1;
    while (endIdx < lines.length) {
        const trimmed = lines[endIdx].trim();
        if (/^##\s+/.test(trimmed) && !/^##\s+on this page\s*$/i.test(trimmed)) break;
        endIdx++;
    }

    const result = [...lines.slice(0, startIdx), ...lines.slice(endIdx)];
    while (
        startIdx < result.length &&
        (result[startIdx].trim() === "" || result[startIdx].trim() === "---")
    ) {
        result.splice(startIdx, 1);
    }

    return result.join("\n");
}

const personalLoansRawContent = typeof personalLoansRaw === "string" ? personalLoansRaw : "";

const PERSONAL_LOANS_DOC = stripRedundantMarkdownHorizontalRules(
    stripOnThisPage(stripMarkdownTableOfContents(personalLoansRawContent))
);

function isPersonalLoanFis12(
    domain: string,
    version: string,
    slug: string,
    apiUsecase?: string
): boolean {
    if (domain !== "ONDC:FIS12" || version !== "2.0.3") return false;
    return normalizeUseCase(apiUsecase ?? slug) === "personal-loan";
}

/** Apply frontend doc overrides for specific domain/version/use-case combinations. */
export function resolveUseCaseDocs(
    domain: string,
    version: string,
    slug: string,
    apiUsecase: string | undefined,
    apiDocs: Record<string, string> | undefined
): Record<string, string> | undefined {
    if (isPersonalLoanFis12(domain, version, slug, apiUsecase)) {
        return { [PERSONAL_LOANS_DOC_SLUG]: PERSONAL_LOANS_DOC };
    }
    return apiDocs;
}
