import { developerGuideApiClient } from "./apiClient";
import { UserDetails } from "@components/Header";
import { API_ROUTES } from "./apiRoutes";
import { authTokenManager } from "@utils/localStorageManager";

/**
 * Authentication service for handling auth-related API calls
 */
export class AuthService {
    /**
     * Exchange OAuth code for application token
     */
    static async exchangeCodeForToken(code: string): Promise<string | null> {
        try {
            const response = await developerGuideApiClient.post<{
                token?: string;
            }>(API_ROUTES.AUTH.EXCHANGE, { code });

            const token = response?.data?.token;

            return token || null;
        } catch (error) {
            console.error("Error exchanging auth code:", error);
            return null;
        }
    }

    /**
     * Get current user information
     */
    static async getCurrentUser(): Promise<{ ok: boolean; user: UserDetails } | null> {
        try {
            // const response = await apiClient.get<{ ok: boolean; user: UserDetails }>(
            //     API_ROUTES.AUTH.ME
            // );
            // return response.data;

            const response = await developerGuideApiClient.get<{ ok: boolean; user: UserDetails }>(
                API_ROUTES.AUTH.ME
            );

            return response.data;
        } catch (error) {
            console.error("Error fetching current user:", error);
            authTokenManager.remove();
            return null;
        }
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        try {
            // await apiClient.post(API_ROUTES.AUTH.LOGOUT, {}, { withCredentials: true });
            // await developerGuideApiClient.get(API_ROUTES.AUTH.LOGOUT, {});
            authTokenManager.remove();
        } catch (error) {
            console.error("Error during logout:", error);
            throw error;
        }
    }
}

export default AuthService;
