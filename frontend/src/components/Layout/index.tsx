import { useLocation } from "react-router-dom";
import { Toaster } from "@components/Shadcn/Toaster";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";
import Header from "@components/Header";
import Footer from "@components/Footer";
import Routes from "@components/Routes";
import { useAppSelector } from "@store/hooks";
import { selectAuthToken, selectIsLoginPending } from "@store/slices/authSlice";
import { isDev } from "@/types/environment";

/** True while the OAuth callback query param is still on the URL (pre-exchange). */
const hasOAuthCallbackCode = (search: string) => new URLSearchParams(search).has("code");

const Layout = () => {
    const location = useLocation();
    const isLoginPending = useAppSelector(selectIsLoginPending);
    const token = useAppSelector(selectAuthToken);
    const isOAuthCallback = hasOAuthCallbackCode(location.search);

    // Keep one continuous overlay from GitHub return through getMe — not just while ?code= is present.
    const showLoginOverlay = isOAuthCallback || isLoginPending;

    // Hide page chrome while the callback URL is settling, and after exchange until profile is ready,
    // so Routes/Footer don't mount then remount under a clearing translucent overlay.
    const suppressPageContent = isOAuthCallback || (isLoginPending && Boolean(token));

    return (
        <div className="flex min-h-svh flex-col bg-surface-page text-text-primary">
            <Header />

            <div
                className={`flex min-h-0 flex-1 flex-col bg-surface-page ${isDev ? "pt-24" : "pt-16"}`}
            >
                {suppressPageContent ? null : <Routes />}
            </div>

            {suppressPageContent ? null : <Footer />}

            {showLoginOverlay ? <LoadingOverlay /> : null}

            <Toaster />
        </div>
    );
};

export default Layout;
