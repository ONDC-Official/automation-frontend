import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { AuthProvider } from "@/context/authContext";
import { SessionProvider } from "@context/context";
import { ThemeContextProvider } from "@/context/theme/themeContextProvider";
import { store, persistor } from "@store/index";
import { runLegacyStorageMigration } from "@store/legacyStorageMigration";
import { trackPageView } from "@utils/analytics";
import { sessionIdSupport } from "@utils/localStorageManager";
import Layout from "@components/Layout";

const Wrapper = () => {
    const location = useLocation();

    // Clean up invalid sessionIdForSupport from localStorage
    useEffect(() => {
        sessionIdSupport.validateAndCleanup();
    }, []);

    // Track page views for analytics
    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location.pathname, location.search]);

    return (
        <AuthProvider>
            <SessionProvider>
                <Layout />
            </SessionProvider>
        </AuthProvider>
    );
};

const App = () => (
    <Provider store={store}>
        <PersistGate
            loading={null}
            persistor={persistor}
            onBeforeLift={() => runLegacyStorageMigration(store)}
        >
            <ThemeContextProvider>
                <BrowserRouter>
                    <Wrapper />
                </BrowserRouter>
            </ThemeContextProvider>
        </PersistGate>
    </Provider>
);

export default App;
