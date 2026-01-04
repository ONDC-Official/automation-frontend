/**
 * Services module exports
 *
 * This module provides centralized API client and service exports
 */

export { apiClient, axiosInstance, default as ApiClient } from "./apiClient";
export type { ApiResponse, ApiError } from "./apiClient";
export { AuthService, default as authService } from "./authService";
export { API_ROUTES } from "./apiRoutes";
