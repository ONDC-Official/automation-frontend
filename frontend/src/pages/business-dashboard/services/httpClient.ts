import axios, { AxiosError } from "axios";

export interface ApiError {
    status: number;
    /** always renderable — validation failures arrive here already joined */
    message: string;
    /**
     * Every validation problem, when the server sent a 400
     * `{ error: true, messages: [...] }`. Render the whole list, not just the first.
     */
    messages?: string[];
    body?: unknown;
}

/**
 * The single axios instance for the dashboard. It points at the backend's
 * `/dashboard` router, which injects the upstream `x-api-key` and terminates
 * the dashboard session — so `withCredentials` is on (the session is an
 * httpOnly cookie) and the browser never sees an API key.
 *
 * Deliberately its own instance rather than one of the RTK Query APIs in
 * `@store/api`: those attach the workbench's Bearer token, which this proxy
 * neither wants nor accepts. The hooks below also depend on the ApiError shape
 * normalised here.
 *
 * Nothing outside `@pages/business-dashboard/hooks/` imports this file.
 */
const httpClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/dashboard`,
    timeout: 30_000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

interface ErrorBody {
    message?: string;
    /** legacy handlers send a string here; the validator sends the boolean `true` */
    error?: string | boolean;
    messages?: string[];
}

httpClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorBody>) => {
        const data = error.response?.data;

        // A 400 from the new endpoints is `{ error: true, messages: [...] }` with
        // every problem at once. Keep the list intact and join it for the default
        // single-line rendering — `error` is a boolean there, never a message.
        const messages =
            Array.isArray(data?.messages) && data.messages.length > 0 ? data.messages : undefined;

        const legacyError = typeof data?.error === "string" ? data.error : undefined;

        const apiError: ApiError = {
            status: error.response?.status ?? 0,
            message:
                messages?.join(" · ") ??
                data?.message ??
                legacyError ??
                error.message ??
                "Something went wrong",
            messages,
            body: data,
        };
        return Promise.reject(apiError);
    }
);

export default httpClient;
