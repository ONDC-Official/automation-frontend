import { developerGuideApiClient } from "./apiClient";
import { API_ROUTES } from "./apiRoutes";
import { authTokenManager } from "@utils/localStorageManager";
import { IUser } from "@/types/user";

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

            if (token) {
                authTokenManager.set(token);
            }

            return token || null;
        } catch (error) {
            console.error("Error exchanging auth code:", error);
            return null;
        }
    }

    /**
     * Fetch the current user and return them if the session is valid.
     * Returns null when unauthenticated or on error.
     */
    static async getUser(): Promise<IUser | null> {
        try {
            const response = await AuthService.fetchUser();

            if (response?.ok && response.user) {
                return response.user;
            }

            return null;
        } catch (error) {
            console.error("Error fetching user:", error);
            return null;
        }
    }

    /**
     * Get current user information
     */
    static async fetchUser(): Promise<{ ok: boolean; user: IUser } | null> {
        try {
            const response = await developerGuideApiClient.get<{ ok: boolean; user: IUser }>(
                API_ROUTES.AUTH.ME
            );

            return response.data;
        } catch (error) {
            console.error("Error fetching current user:", error);
            authTokenManager.remove();
            return null;
        }
    }

    static async logout(): Promise<void> {
        try {
            authTokenManager.remove();
        } catch (error) {
            console.error("Error during logout:", error);
            throw error;
        }
    }
}

export default AuthService;
