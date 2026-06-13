import type { IParsedValidationError } from "@/pages/schema-validation/types";
import {
    parseMarkdownValidationErrors,
    parsePlainValidationErrors,
} from "@/pages/schema-validation/utils/helpers";

/**
 * Parses validation error content from the schema validation API.
 *
 * Combines L1 markdown rule errors and L0 JSON Schema errors when both are present.
 *
 * @param markdown - Error markdown or plain-text payload from `response.data.error.message`
 * @returns Normalized list of validation errors for UI rendering and editor highlighting
 */
export function parseValidationErrors(markdown: string): IParsedValidationError[] {
    if (!markdown?.trim()) {
        return [];
    }

    const markdownErrors = parseMarkdownValidationErrors(markdown);
    const plainErrors = parsePlainValidationErrors(markdown);

    const combined = [...plainErrors, ...markdownErrors];
    const seen = new Set<string>();

    return combined.filter((error) => {
        const key = `${error.code}|${error.path}|${error.message}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Formats a JSON path for compact display in the error panel.
 *
 * @param path - Raw JSON path from the API
 * @returns Display-friendly path without leading `$` or `/`
 */
export function formatErrorPath(path: string): string {
    return path
        .replace(/^\$\.?/, "")
        .replace(/^\//, "")
        .replace(/\$/g, "");
}
