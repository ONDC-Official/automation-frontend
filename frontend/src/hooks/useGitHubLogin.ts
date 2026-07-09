import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { useAuth } from "@hooks/useAuth";
import { selectIsLoginPending, setLoginPending } from "@store/slices/authSlice";

const LOGIN_PENDING_TIMEOUT_MS = 5 * 60 * 1000;

const hasOAuthCallbackCode = () => new URLSearchParams(window.location.search).has("code");

export const useGitHubLogin = () => {
    const dispatch = useAppDispatch();
    const { user, token } = useAuth();
    const isLoginRedirecting = useAppSelector(selectIsLoginPending);

    const clearPendingLogin = useCallback(() => {
        dispatch(setLoginPending(false));
    }, [dispatch]);

    const resetPendingLoginIfAbandoned = useCallback(() => {
        if (!isLoginRedirecting) {
            return;
        }

        if (user || token || hasOAuthCallbackCode()) {
            return;
        }

        clearPendingLogin();
    }, [clearPendingLogin, isLoginRedirecting, token, user]);

    const startLogin = useCallback(() => {
        dispatch(setLoginPending(true));

        const backendUrl = import.meta.env.VITE_DEVELOPER_GUIDE_BACKEND_URL;
        window.location.href = `${backendUrl}/login`;
    }, [dispatch]);

    useEffect(() => {
        if (user || token) {
            clearPendingLogin();
        }
    }, [clearPendingLogin, token, user]);

    useEffect(() => {
        resetPendingLoginIfAbandoned();

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                resetPendingLoginIfAbandoned();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                resetPendingLoginIfAbandoned();
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [resetPendingLoginIfAbandoned]);

    useEffect(() => {
        if (!isLoginRedirecting) {
            return;
        }

        const timeoutId = window.setTimeout(clearPendingLogin, LOGIN_PENDING_TIMEOUT_MS);
        return () => window.clearTimeout(timeoutId);
    }, [clearPendingLogin, isLoginRedirecting]);

    return { startLogin, isLoginRedirecting };
};
