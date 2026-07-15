import GithubSlugger, { slug as slugify } from "github-slugger";

export interface MarkdownTocEntry {
    level: 2 | 3;
    text: string;
    id: string;
}

/** Removes leading ordered-list style prefixes (e.g. "1. ", "1.1 ", "2.3.1 "). */
export function stripHeadingNumberPrefix(text: string): string {
    return text.replace(/^\d+(?:\.\d+)*\.?\s*/, "").trim();
}

export interface NestedMarkdownTocSection {
    section: MarkdownTocEntry;
    subsections: MarkdownTocEntry[];
}

/** Groups h3 headings under their preceding h2 section. */
export function extractNestedMarkdownToc(markdown: string): NestedMarkdownTocSection[] {
    const flat = extractMarkdownToc(markdown).filter(
        (entry) => entry.text.toLowerCase() !== "table of contents"
    );

    const nested: NestedMarkdownTocSection[] = [];
    let current: NestedMarkdownTocSection | null = null;

    for (const entry of flat) {
        if (entry.level === 2) {
            current = { section: entry, subsections: [] };
            nested.push(current);
            continue;
        }
        if (current) {
            current.subsections.push(entry);
        } else {
            nested.push({ section: entry, subsections: [] });
        }
    }

    return nested;
}

/** Matches the id `rehype-slug` (via `github-slugger`) assigns to the actual heading in GithubMarkdown. */
export function slugifyHeading(text: string): string {
    return slugify(text);
}

const TABLE_OF_CONTENTS_HEADING = /^##\s+table of contents\s*$/i;
const MARKDOWN_HEADING = /^#{1,6}\s+\S/;
const THEMATIC_BREAK = /^---$/;

function isMarkdownHeading(line: string): boolean {
    return MARKDOWN_HEADING.test(line.trim());
}

function nearestNonEmptyLine(lines: string[], from: number, direction: -1 | 1): string | undefined {
    for (let i = from; i >= 0 && i < lines.length; i += direction) {
        const trimmed = lines[i].trim();
        if (trimmed !== "") return trimmed;
    }
    return undefined;
}

/**
 * Removes standalone `---` rules next to headings.
 * Docs render headings without underlines; keeping those rules leaves uneven empty gaps
 * (and used to stack with heading border-b). Mid-content breaks are left alone.
 */
export function stripRedundantMarkdownHorizontalRules(markdown: string): string {
    const lines = markdown.split("\n");
    const kept: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        if (!THEMATIC_BREAK.test(lines[i].trim())) {
            kept.push(lines[i]);
            continue;
        }

        const previous = nearestNonEmptyLine(kept, kept.length - 1, -1);
        const next = nearestNonEmptyLine(lines, i + 1, 1);
        if (
            (previous !== undefined && isMarkdownHeading(previous)) ||
            (next !== undefined && isMarkdownHeading(next))
        ) {
            continue;
        }

        kept.push(lines[i]);
    }

    return kept.join("\n");
}

/** Removes the in-document "## Table of Contents" block (through the next h2). */
export function stripMarkdownTableOfContents(markdown: string): string {
    const lines = markdown.split("\n");
    const startIdx = lines.findIndex((line) => TABLE_OF_CONTENTS_HEADING.test(line.trim()));
    if (startIdx === -1) return markdown;

    let endIdx = startIdx + 1;
    while (endIdx < lines.length) {
        const trimmed = lines[endIdx].trim();
        if (/^##\s+/.test(trimmed) && !TABLE_OF_CONTENTS_HEADING.test(trimmed)) break;
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

export function extractMarkdownToc(markdown: string): MarkdownTocEntry[] {
    const toc: MarkdownTocEntry[] = [];
    // A shared slugger (reset per document) so repeated heading text is de-duped
    // ("-1", "-2", ...) the same way `rehype-slug` de-dupes ids on the rendered headings.
    const slugger = new GithubSlugger();
    for (const line of markdown.split("\n")) {
        const h2 = /^## (.+)/.exec(line);
        const h3 = /^### (.+)/.exec(line);
        if (h2) toc.push({ level: 2, text: h2[1].trim(), id: slugger.slug(h2[1].trim()) });
        else if (h3) toc.push({ level: 3, text: h3[1].trim(), id: slugger.slug(h3[1].trim()) });
    }
    return toc;
}
