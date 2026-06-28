import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";

/**
 * Response from GET /form/check-completion.
 * The api-service GET /callback writes form_completed:{transaction_id}; the
 * backend reads it and returns this shape.
 */
export interface CheckCompletionResponse {
    completed: boolean;
    success?: boolean;
    message?: string;
    timestamp?: string;
}

/**
 * Form callback service — wraps the transaction-scoped form-completion endpoints.
 *
 * Contract (keyed by transaction_id): the form's final step fires a callback that
 * writes form_completed:{transaction_id}; the frontend polls check-completion and
 * clears stale state with reset-completion before each run.
 */
export class FormService {
    /**
     * Poll whether the form callback has been received for this transaction.
     * GET /form/check-completion?transaction_id=X
     */
    static async checkCompletion(transactionId: string): Promise<CheckCompletionResponse> {
        const response = await apiClient.get<CheckCompletionResponse>(
            API_ROUTES.FORM.CHECK_COMPLETION,
            { params: { transaction_id: transactionId }, timeout: 5000 }
        );
        return response.data;
    }

    /**
     * Clear any leftover completion for this transaction before polling starts.
     * POST /form/reset-completion   body: { transaction_id }
     */
    static async resetCompletion(transactionId: string): Promise<void> {
        await apiClient.post(
            API_ROUTES.FORM.RESET_COMPLETION,
            { transaction_id: transactionId },
            { timeout: 5000 }
        );
    }

    /**
     * Store the workbench tab URL to return to after the form callback, keyed by
     * transaction_id (the callback looks it up by transaction_id and uses it as
     * the 302 target). Pass the current page URL verbatim (window.location.href).
     * POST /form/save-redirection   body: { redirection_url, transaction_id }
     */
    static async saveRedirection(redirectionUrl: string, transactionId: string): Promise<void> {
        await apiClient.post(
            API_ROUTES.FORM.SAVE_REDIRECTION,
            { redirection_url: redirectionUrl, transaction_id: transactionId },
            { timeout: 5000 }
        );
    }
}

export default FormService;
