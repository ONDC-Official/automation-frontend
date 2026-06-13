import { ConfigProvider } from "antd";
import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "@context/userContext";
import { SubscriberData } from "@components/registry-components/registry-types";
import { SessionProvider } from "@context/context";
import { GuideProvider } from "@context/guideContext";
import { ThemeContextProvider } from "@/context/theme/themeContextProvider";
import { trackPageView } from "@utils/analytics";
import { AuthService } from "@services/authService";
import { authTokenManager, sessionIdSupport } from "@utils/localStorageManager";
import Layout from "@components/Layout";
import { IUser } from "@/types/user";
import { ROUTES } from "@/constants/routes";

const Wrapper = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState<IUser | undefined>(undefined);
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

        // AuthService.exchangeCodeAndPersistToken(codeFromQuery);

        const exchangeCodeAndPersistToken = async () => {
            const token = await AuthService.exchangeCodeForToken(codeFromQuery);

            if (!token) {
                return;
            }

            authTokenManager.set(token);

            await refreshUser();

            const nextParams = new URLSearchParams(location.search);
            nextParams.delete("code");

            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndPersistToken();
    }, [location.pathname, location.search]);

    const refreshUser = useCallback(async (): Promise<void> => {
        const user = await AuthService.refreshUser();
        if (user) {
            setUser(user);
            setIsLoggedIn(true);
        } else {
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
            </SessionProvider>
        </UserContext.Provider>
    );
};

const App = () => {
    return (
        <ThemeContextProvider>
            <ConfigProvider>
                <BrowserRouter>
                    <GuideProvider>
                        <Wrapper />
                    </GuideProvider>
                </BrowserRouter>
            </ConfigProvider>
        </ThemeContextProvider>
    );
};

export default App;
