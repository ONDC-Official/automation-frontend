import { apiClient } from "@services/apiClient";
import { API_ROUTES } from "@services/apiRoutes";

/**
 * Response from GET /form/check-completion.
 * The api-service GET /callback writes form_completed:{session_id}; the backend
 * reads it and returns this shape.
 */
export interface CheckCompletionResponse {
    completed: boolean;
    success?: boolean;
    message?: string;
    timestamp?: string;
}

/**
 * Form callback service — wraps the session-scoped form-completion endpoints.
 *
 * Contract (keyed by session_id): the form's final step fires a callback that
 * writes form_completed:{session_id}; the frontend polls check-completion and
 * clears stale state with reset-completion before each run.
 */
export class FormService {
    /**
     * Poll whether the form callback has been received for this session.
     * GET /form/check-completion?session_id=X
     */
    static async checkCompletion(sessionId: string): Promise<CheckCompletionResponse> {
        const response = await apiClient.get<CheckCompletionResponse>(
            API_ROUTES.FORM.CHECK_COMPLETION,
            { params: { session_id: sessionId }, timeout: 5000 }
        );
        return response.data;
    }

    /**
     * Clear any leftover completion for this session before polling starts.
     * POST /form/reset-completion?session_id=X
     */
    static async resetCompletion(sessionId: string): Promise<void> {
        // session_id goes as a query param; send an empty object as the body
        // (sending null tripped the backend's JSON parsing).
        await apiClient.post(
            API_ROUTES.FORM.RESET_COMPLETION,
            {},
            {
                params: { session_id: sessionId },
                timeout: 5000,
            }
        );
    }

    /**
     * Store the workbench tab URL to return to after the form callback. Pass the
     * current page URL verbatim (window.location.href) — it already carries the
     * subscriberUrl and sessionId query params the callback needs.
     * POST /form/save-redirection   body: { redirection_url }
     */
    static async saveRedirection(redirectionUrl: string): Promise<void> {
        await apiClient.post(
            API_ROUTES.FORM.SAVE_REDIRECTION,
            { redirection_url: redirectionUrl },
            { timeout: 5000 }
        );
    }
}

export default FormService;
