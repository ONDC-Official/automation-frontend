import { VALIDATION_MESSAGES, VALIDATION_PATHS } from "../constants";
import type { IParsedValidationError } from "@/pages/schema-validation/types";

export type ValidationErrorCode = keyof typeof VALIDATION_MESSAGES;

/**
 * Builds a structured client validation error for the validation errors panel.
 *
 * @param code - Client validation error code
 * @param path - Optional JSON path override for editor highlighting
 * @returns Parsed validation error for UI rendering
 */
export function buildValidationError(
    code: ValidationErrorCode,
    path?: string
): IParsedValidationError {
    const resolvedPath =
        path ??
        (code in VALIDATION_PATHS ? VALIDATION_PATHS[code as keyof typeof VALIDATION_PATHS] : "");

    return {
        code,
        path: resolvedPath,
        message: VALIDATION_MESSAGES[code],
    };
}
