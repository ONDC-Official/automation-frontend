/** Structured validation error parsed from API responses */
export interface IParsedValidationError {
    code: string;
    path: string;
    message: string;
    propertyKey?: string;
}
