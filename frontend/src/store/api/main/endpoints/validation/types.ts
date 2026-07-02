export interface IValidateActionParams {
    action: string;
    payload: unknown;
}

export interface IValidationResponse {
    error?: {
        message?: string;
    };
    [key: string]: unknown;
}
