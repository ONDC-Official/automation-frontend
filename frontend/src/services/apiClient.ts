import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T = unknown> {
    data: T;
    ok?: boolean;
    error?: string;
    message?: string;
}

/**
 * Custom error interface for API errors
 */
export interface ApiError {
    message?: string;
    error?: string;
    status?: number;
    data?: unknown;
}

/**
 * Configuration for the API client
 */
interface ApiClientConfig {
    baseURL?: string;
    timeout?: number;
    withCredentials?: boolean;
}

/**
 * Creates a configured axios instance with interceptors
 */
class ApiClient {
    private instance: AxiosInstance;
    private baseURL: string;

    constructor(config?: ApiClientConfig) {
        this.baseURL = config?.baseURL || import.meta.env.VITE_BACKEND_URL || "";

        this.instance = axios.create({
            baseURL: this.baseURL,
            timeout: config?.timeout || 30000, // 30 seconds default
            withCredentials: config?.withCredentials ?? true,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor
        this.instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // Add any custom headers here
                // For example, API keys for specific endpoints
                if (config.url?.includes("/api/sessions/flows")) {
                    const apiKey = import.meta.env.VITE_DB_SERVICE_API_KEY;
                    if (apiKey) {
                        config.headers["x-api-key"] = apiKey;
                    }
                }

                return config;
            },
            (error: AxiosError) => {
                console.error("[API Request Error]", error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.instance.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error: AxiosError<ApiError>) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get the axios instance
     */
    public getInstance(): AxiosInstance {
        return this.instance;
    }

    /**
     * GET request
     */
    public async get<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        const response = await this.instance.get<T>(url, config);
        return {
            data: response.data,
            ok: true,
        };
    }

    /**
     * POST request
     */
    public async post<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        const response = await this.instance.post<T>(url, data, config);
        return {
            data: response.data,
            ok: true,
        };
    }

    /**
     * PUT request
     */
    public async put<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        const response = await this.instance.put<T>(url, data, config);
        return {
            data: response.data,
            ok: true,
        };
    }

    /**
     * PATCH request
     */
    public async patch<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        const response = await this.instance.patch<T>(url, data, config);
        return {
            data: response.data,
            ok: true,
        };
    }

    /**
     * DELETE request
     */
    public async delete<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        const response = await this.instance.delete<T>(url, config);
        return {
            data: response.data,
            ok: true,
        };
    }
}

// Create and export a singleton instance
export const apiClient = new ApiClient({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
    timeout: 30000,
});

// Export the axios instance for direct access if needed
export const axiosInstance = apiClient.getInstance();

// Export default for convenience
export default apiClient;
