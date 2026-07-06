/**
 * Response from GET /form/check-completion.
 * The api-service GET /callback writes form_completed:{transaction_id}; the
 * backend reads it and returns this shape.
 */
export interface ICheckCompletionResponse {
    completed: boolean;
    success?: boolean;
    message?: string;
    timestamp?: string;
}

export interface IFinvuCompletionResponse {
    completed: boolean;
}

export interface IFinvuVerifyConsentResponse {
    url: string;
}
