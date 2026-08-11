import axios from "axios";

/**
 * The dashboard's axios instance. It points at the backend's `/dashboard`
 * router, which injects the upstream `x-api-key` and terminates the dashboard
 * session — so `withCredentials` is on (the session is an httpOnly cookie) and
 * the browser never sees an API key.
 *
 * Deliberately its own instance rather than `@services/apiClient`: that one
 * attaches the workbench Bearer token and, on any URL containing
 * `/api/sessions/flows`, VITE_DB_SERVICE_API_KEY. The read-only proxy accepts
 * neither, and the dashboard has no business carrying that key.
 *
 * No interceptors: `axiosBaseQuery` normalises errors for every RTK Query
 * endpoint built on this instance (see store/api/dashboard).
 */
const httpClient = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/dashboard`,
    timeout: 30_000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

export default httpClient;
