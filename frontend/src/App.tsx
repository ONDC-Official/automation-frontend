import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { UserDetails } from "@components/Header";
import { UserContext } from "@context/userContext";
import { getGithubAvatarUrl } from "@utils/regsitry-utils";
import { SubscriberData } from "@components/registry-components/registry-types";
import * as api from "@utils/registry-apis";
import { SessionProvider } from "@context/context";
import { trackPageView } from "@utils/analytics";
import { AuthService } from "@services/authService";
import { sessionIdSupport } from "@utils/localStorageManager";
import Layout from "@components/Layout";

function App() {
  const location = useLocation();

  const [user, setUser] = useState<UserDetails | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [subscriberData, setSubscriberData] = useState<SubscriberData>({
    keys: [],
    mappings: [],
  });

  // Clean up invalid sessionIdForSupport from localStorage
  useEffect(() => {
    sessionIdSupport.validateAndCleanup();
  }, []);

  // Track page views for analytics
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const fetchUserLookUp = useCallback(
    async (tempUser?: UserDetails): Promise<SubscriberData | null> => {
      const userToLookup = tempUser ?? user;

      if (!userToLookup) {
        return null;
      }

      try {
        const data = await api.getSubscriberDetails(userToLookup);
        setSubscriberData(data);
        return data;
      } catch (error) {
        console.error("Error fetching subscriber details:", error);
        return null;
      }
    },
    [user],
  );

  // Fetch subscriber details when user or pathname changes
  useEffect(() => {
    if (user) {
      fetchUserLookUp();
    }
  }, [location.pathname, user, fetchUserLookUp]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await AuthService.getCurrentUser();

      if (response?.ok && response.user) {
        const avatarUrl = await getGithubAvatarUrl(response.user.githubId);
        const userWithAvatar: UserDetails = {
          ...response.user,
          avatarUrl: avatarUrl,
        };
        setUser(userWithAvatar);
        setIsLoggedIn(true);
      } else {
        setUser(undefined);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(undefined);
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        userDetails: user,
        refreshUser: refreshUser,
        subscriberData: subscriberData,
        setSubscriberData: setSubscriberData,
      }}>
      <SessionProvider>
        <Layout />
      </SessionProvider>
    </UserContext.Provider>
  );
}

export default App;
