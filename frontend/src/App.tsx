import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ThemeWrapper from "@/theme";
import { AuthInitializer } from "@/hooks/useAuthInitialization";
import { store, persistor } from "@store/index";
import { runLegacyStorageMigration } from "@store/legacyStorageMigration";
import { trackPageView } from "@utils/analytics";
import { sessionIdSupport } from "@utils/localStorageManager";
import Layout from "@components/Layout";

const Wrapper = () => {
    const location = useLocation();

    useEffect(() => {
        sessionIdSupport.validateAndCleanup();
    }, []);

    useEffect(() => {
        trackPageView(location.pathname + location.search);
    }, [location.pathname, location.search]);

    return (
        <>
            <AuthInitializer />
            <Layout />
        </>
    );
};

const App = () => (
    <Provider store={store}>
        <PersistGate
            loading={null}
            persistor={persistor}
            onBeforeLift={() => runLegacyStorageMigration(store)}
        >
            <ThemeWrapper />
            <BrowserRouter>
                <Wrapper />
            </BrowserRouter>
        </PersistGate>
    </Provider>
);

export default App;
