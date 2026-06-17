import { IEditorRange } from "@/pages/schema-validation/types";
import type {
    IParsedValidationError,
    IParsedPayload,
    IActiveDomainConfig,
    IPayloadContext,
    IValidationResult,
} from "@/pages/schema-validation/types";
import {
    MARKDOWN_BLOCK_REGEX,
    LIST_ITEM_REGEX,
    AJV_AT_PATH_REGEX,
    ADDITIONAL_PROPERTY_REGEX,
} from "@/pages/schema-validation/constants";
import { buildValidationError } from "@/pages/schema-validation/utils/validationErrors";

/**
 * Escapes a string for safe use inside a RegExp.
 *
 * @param value - Raw string
 * @returns Escaped string
 */
export function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a Monaco range for a full source line containing an index.
 *
 * @param source - Full JSON source
 * @param index - Character index inside the source
 * @returns Whole-line range
 */
export function getLineRangeAtIndex(source: string, index: number): IEditorRange {
    const lineStart = source.lastIndexOf("\n", index) + 1;
    const lineEndIndex = source.indexOf("\n", index);
    const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
    const line = source.slice(lineStart, lineEnd);
    const startLineNumber = source.slice(0, lineStart).split("\n").length;

    return {
        startLineNumber,
        startColumn: 1,
        endLineNumber: startLineNumber,
        endColumn: line.length + 1,
    };
}

/**
 * Builds a Monaco range for the JSON value on a line.
 *
 * @param lineStart - Start index of the line in the source
 * @param line - Line text
 * @param startLineNumber - Monaco line number
 * @returns Value range when a value token is present
 */
export function getValueRangeOnLine(
    lineStart: number,
    line: string,
    startLineNumber: number
): IEditorRange | null {
    const valueMatch = line.match(/:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,\n]+)/);
    if (!valueMatch?.[1]) {
        return null;
    }

    const valueText = valueMatch[1];
    const valueStart = lineStart + valueMatch.index! + valueMatch[0].indexOf(valueText);

    return {
        startLineNumber,
        startColumn: valueStart - lineStart + 1,
        endLineNumber: startLineNumber,
        endColumn: valueStart - lineStart + valueText.length + 1,
    };
}

/**
 * Builds a Monaco range for a JSON object key on a line.
 *
 * @param lineStart - Start index of the line in the source
 * @param line - Line text
 * @param startLineNumber - Monaco line number
 * @param keyName - JSON property key
 * @returns Key range when present on the line
 */
export function getKeyRangeOnLine(
    lineStart: number,
    line: string,
    startLineNumber: number,
    keyName: string
): IEditorRange | null {
    const keyMatch = line.match(new RegExp(`"${escapeRegExp(keyName)}"\\s*:`));
    if (!keyMatch || keyMatch.index === undefined) {
        return null;
    }

    const keyText = `"${keyName}"`;
    const keyStart = lineStart + keyMatch.index;

    return {
        startLineNumber,
        startColumn: keyStart - lineStart + 1,
        endLineNumber: startLineNumber,
        endColumn: keyStart - lineStart + keyText.length + 1,
    };
}

/**
 * Extracts a JSON path token from a validation bullet line.
 *
 * @param line - Bullet content without the leading dash
 * @returns Raw JSON path when present
 */
function extractPathFromLine(line: string): string {
    const trimmed = line.trim();
    const backtickMatch = trimmed.match(/`([^`]+)`/);
    if (backtickMatch?.[1]) {
        return backtickMatch[1].trim();
    }

    const dollarMatch = trimmed.match(/(\$\.[^\s]+)/);
    if (dollarMatch?.[1]) {
        return dollarMatch[1].trim();
    }

    const slashMatch = trimmed.match(/^(\/[^\s]+)/);
    if (slashMatch?.[1]) {
        return slashMatch[1].trim();
    }

    return "";
}

/**
 * Parses a single bullet line from a validation error block.
 *
 * @param code - Error rule code from the markdown heading
 * @param line - Bullet line content excluding the leading dash
 * @returns Parsed error or null when the line cannot be interpreted
 */
export function parseErrorBulletLine(code: string, line: string): IParsedValidationError | null {
    const trimmed = line.trim();
    const path = extractPathFromLine(trimmed);

    if (!path) {
        return {
            code,
            path: "",
            message: trimmed,
        };
    }

    const message = trimmed
        .replace(/`[^`]+`/, "")
        .replace(/(\$\.[^\s]+)/, "")
        .replace(/^(\/[^\s]+)/, "")
        .trim();

    return {
        code,
        path,
        message: message || "Validation failed",
    };
}

/**
 * Parses L1 validation markdown returned by the API.
 *
 * Expected format:
 * #### **ERROR_CODE**
 * - `$.path.to.field` must be present in the payload
 *
 * @param markdown - Raw markdown error message from the validation API
 * @returns Parsed validation errors
 */
export function parseMarkdownValidationErrors(markdown: string): IParsedValidationError[] {
    const errors: IParsedValidationError[] = [];
    const blocks = markdown.matchAll(MARKDOWN_BLOCK_REGEX);

    for (const block of blocks) {
        const code = block[1].trim();
        const body = block[2].trim();
        const lines = body.split("\n").filter((line) => LIST_ITEM_REGEX.test(line.trim()));

        for (const line of lines) {
            const parsed = parseErrorBulletLine(code, line.replace(LIST_ITEM_REGEX, ""));
            if (parsed) {
                errors.push(parsed);
            }
        }
    }

    return errors;
}

/**
 * Splits plain-text schema validation errors into individual entries.
 *
 * @param message - Raw plain-text error payload
 * @returns Candidate error strings
 */
export function splitPlainValidationErrors(message: string): string[] {
    const trimmed = message.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.includes("\n")) {
        return trimmed
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
    }

    if (/,\s*at\s+['"]/.test(trimmed)) {
        return trimmed
            .split(/,\s*(?=at\s+['"])/i)
            .map((part) => part.trim())
            .filter(Boolean);
    }

    return [trimmed];
}

/**
 * Builds a highlight path for AJV-style schema errors.
 *
 * @param parentPath - Parent JSON pointer such as `/message/intent/fulfillment`
 * @param propertyKey - Optional invalid property key
 * @returns Full path used for editor lookup
 */
export function buildSchemaHighlightPath(parentPath: string, propertyKey?: string): string {
    if (!propertyKey) {
        return parentPath;
    }

    if (parentPath.endsWith(`/${propertyKey}`)) {
        return parentPath;
    }

    return `${parentPath}/${propertyKey}`;
}

/**
 * Parses a single AJV / JSON Schema validation error string.
 *
 * @param part - One schema validation error
 * @returns Parsed error or null when the string is not a schema error
 */
export function parseSchemaValidationError(part: string): IParsedValidationError | null {
    const trimmed = part.trim();
    if (!trimmed || trimmed.includes("#### **") || LIST_ITEM_REGEX.test(trimmed)) {
        return null;
    }

    const ajvMatch = trimmed.match(AJV_AT_PATH_REGEX);
    if (ajvMatch) {
        const parentPath = ajvMatch[2].trim();
        const detail = ajvMatch[3].trim();
        const propertyMatch = detail.match(ADDITIONAL_PROPERTY_REGEX);
        const propertyKey = propertyMatch?.[2]?.trim();

        return {
            code: "SCHEMA_ERROR",
            path: buildSchemaHighlightPath(parentPath, propertyKey),
            propertyKey,
            message: trimmed,
        };
    }

    const slashPath = trimmed.match(/^(\/[^\s:]+)/)?.[1]?.trim() ?? "";
    if (slashPath) {
        return {
            code: "SCHEMA_ERROR",
            path: slashPath,
            message: trimmed,
        };
    }

    return {
        code: "SCHEMA_ERROR",
        path: "",
        message: trimmed,
    };
}

/**
 * Parses L0 schema validation errors from plain text.
 *
 * @param message - Plain-text schema validation errors
 * @returns Parsed validation errors
 */
export function parsePlainValidationErrors(message: string): IParsedValidationError[] {
    const errors: IParsedValidationError[] = [];

    for (const part of splitPlainValidationErrors(message)) {
        const parsed = parseSchemaValidationError(part);
        if (parsed) {
            errors.push(parsed);
        }
    }

    return errors;
}

/**
 * Parses a JSON payload string and validates its structure
 *
 * @param payload - The JSON string to parse
 * @returns Parsed payload or client validation errors
 */
export const parsePayload = (payload: string): IValidationResult<IParsedPayload> => {
    if (payload === "") {
        return {
            ok: false,
            errors: [buildValidationError("EMPTY_PAYLOAD")],
        };
    }

    try {
        const parsedPayload = JSON.parse(payload) as IParsedPayload;

        if (Array.isArray(parsedPayload)) {
            return {
                ok: false,
                errors: [buildValidationError("ARRAY_NOT_SUPPORTED")],
            };
        }

        return { ok: true, value: parsedPayload };
    } catch (error) {
        console.error("Error while parsing payload:", error);
        return {
            ok: false,
            errors: [buildValidationError("INVALID_PAYLOAD")],
        };
    }
};

/**
 * Validates that the payload contains a required action in its context
 *
 * @param parsedPayload - The parsed payload object
 * @returns Action string or client validation errors
 */
export const validateAction = (parsedPayload: IParsedPayload): IValidationResult<string> => {
    const action = parsedPayload?.context?.action;

    if (!action) {
        return {
            ok: false,
            errors: [buildValidationError("MISSING_ACTION")],
        };
    }

    return { ok: true, value: action };
};

/**
 * Checks if a domain and version combination is active in the configuration
 *
 * @param activeDomain - The active domain configuration
 * @param context - The payload context containing domain and version information
 * @returns True if the domain and version are active, false otherwise
 */
export const isDomainActive = (
    activeDomain: IActiveDomainConfig,
    context: IPayloadContext
): boolean => {
    if (!context.domain) {
        return false;
    }

    const version = context.version || context.core_version;
    if (!version) {
        return false;
    }

    for (const [, domains] of Object.entries(activeDomain)) {
        for (const domain of domains) {
            if (domain.key === context.domain) {
                for (const ver of domain.version) {
                    if (ver.key === version) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
};

/**
 * Validates domain and version are active
 *
 * @param activeDomain - The active domain configuration
 * @param context - The payload context containing domain and version information
 * @returns Success or client validation errors
 */
export const validateDomainAndVersion = (
    activeDomain: IActiveDomainConfig,
    context: IPayloadContext
): IValidationResult<true> => {
    const isValid = isDomainActive(activeDomain, context);

    if (!isValid) {
        return {
            ok: false,
            errors: [buildValidationError("DOMAIN_NOT_ACTIVE")],
        };
    }

    return { ok: true, value: true };
};
