import { apiClient } from "./apiClient";
import { UserDetails } from "@components/Header";

/**
 * Authentication service for handling auth-related API calls
 */
export class AuthService {
  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<{ ok: boolean; user: UserDetails } | null> {
    try {
      const response = await apiClient.get<{ ok: boolean; user: UserDetails }>("/auth/api/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  }
}

export default AuthService;
