import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { UserDetails } from "@components/Header";
import { UserContext } from "@context/userContext";
// import { getGithubAvatarUrl } from "@utils/regsitry-utils";
import { SubscriberData } from "@components/registry-components/registry-types";
// import * as api from "@utils/registry-apis";
import { SessionProvider } from "@context/context";
import { trackPageView } from "@utils/analytics";
import { AuthService } from "@services/authService";
import { authTokenManager, sessionIdSupport } from "@utils/localStorageManager";
import Layout from "@components/Layout";
import Chatbot from "@components/ChatBot";

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

    // Exchange OAuth code from query params for auth token
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const codeFromQuery = queryParams.get("code");

        if (!codeFromQuery) {
            return;
        }

        const exchangeCodeAndPersistToken = async () => {
            const token = await AuthService.exchangeCodeForToken(codeFromQuery);

            if (!token) {
                return;
            }

            authTokenManager.set(token);

            await refreshUser();
        };

        exchangeCodeAndPersistToken();
    }, [location.pathname, location.search]);

    // const fetchUserLookUp = useCallback(
    //     async (tempUser?: UserDetails): Promise<SubscriberData | null> => {
    //         const userToLookup = tempUser ?? user;

    //         if (!userToLookup) {
    //             return null;
    //         }

    //         try {
    //             const data = await api.getSubscriberDetails(userToLookup);
    //             setSubscriberData(data);
    //             return data;
    //         } catch (error) {
    //             console.error("Error fetching subscriber details:", error);
    //             return null;
    //         }
    //     },
    //     [user]
    // );

    // Fetch subscriber details when user or pathname changes
    // useEffect(() => {
    //     if (user) {
    //         fetchUserLookUp();
    //     }
    // }, [location.pathname, user, fetchUserLookUp]);

    const refreshUser = useCallback(async (): Promise<void> => {
        try {
            const response = await AuthService.getCurrentUser();

            if (response?.ok && response.user) {
                // const avatarUrl = await getGithubAvatarUrl(response.user.githubId);
                // const userWithAvatar: UserDetails = {
                //     ...response.user,
                //     avatarUrl: avatarUrl,
                // };
                // setUser(userWithAvatar);
                setUser(response.user);
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

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <UserContext.Provider
            value={{
                isLoggedIn: isLoggedIn,
                userDetails: user,
                refreshUser: refreshUser,
                subscriberData: subscriberData,
                setSubscriberData: setSubscriberData,
            }}
        >
            <SessionProvider>
                <Layout />
                {import.meta.env.VITE_ENVIRONMENT === "development" && <Chatbot />}
            </SessionProvider>
        </UserContext.Provider>
    );
}

export default App;
