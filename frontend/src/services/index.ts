/**
 * Services module exports
 *
 * This module provides centralized API client and service exports
 */

export { apiClient, axiosInstance, default as ApiClient } from "./apiClient";
export type { ApiResponse, ApiError } from "./apiClient";
export { AuthService, default as authService } from "./authService";
export { FormService, default as formService } from "./formService";
export type { CheckCompletionResponse } from "./formService";
export { API_ROUTES } from "./apiRoutes";
