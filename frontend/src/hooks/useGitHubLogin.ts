import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { useAuth } from "@hooks/useAuth";
import { persistor } from "@store/index";
import {
    selectIsLoginPending,
    setLoginPending,
    setPostLoginRedirect,
} from "@store/slices/authSlice";

const LOGIN_PENDING_TIMEOUT_MS = 5 * 60 * 1000;

const hasOAuthCallbackCode = () => new URLSearchParams(window.location.search).has("code");

export const useGitHubLogin = () => {
    const dispatch = useAppDispatch();
    const { user, token } = useAuth();
    const isLoginRedirecting = useAppSelector(selectIsLoginPending);
    /** True only for the in-tab click → navigate window; resets on full reload / bfcache restore. */
    const isStartingLoginRef = useRef(false);

    const clearPendingLogin = useCallback(() => {
        dispatch(setLoginPending(false));
    }, [dispatch]);

    const clearAbandonedLogin = useCallback(() => {
        dispatch(setLoginPending(false));
        dispatch(setPostLoginRedirect(null));
    }, [dispatch]);

    const resetPendingLoginIfAbandoned = useCallback(() => {
        if (!isLoginRedirecting || isStartingLoginRef.current) {
            return;
        }

        // Still in-flight if profile is ready, token arrived, or OAuth callback is mid-exchange.
        if (user || token || hasOAuthCallbackCode()) {
            return;
        }

        clearAbandonedLogin();
    }, [clearAbandonedLogin, isLoginRedirecting, token, user]);

    const startLogin = useCallback(
        (redirectTo?: string) => {
            isStartingLoginRef.current = true;
            dispatch(setPostLoginRedirect(redirectTo ?? null));
            dispatch(setLoginPending(true));

            const backendUrl = import.meta.env.VITE_DEVELOPER_GUIDE_BACKEND_URL;
            // Persist before the full-page OAuth hop — otherwise postLoginRedirect can be lost.
            void persistor.flush().finally(() => {
                window.location.href = `${backendUrl}/login`;
            });
        },
        [dispatch]
    );

    // Option B: keep the overlay through outbound redirect + inbound exchange/getMe
    // until the profile is actually ready — not merely when the token lands.
    useEffect(() => {
        if (user) {
            clearPendingLogin();
        }
    }, [clearPendingLogin, user]);

    // Clear stale pending left over from a previous abandoned OAuth attempt after rehydration.
    // Intentionally mount-only: must not re-run when `isLoginPending` flips true on click.
    const resetPendingLoginIfAbandonedRef = useRef(resetPendingLoginIfAbandoned);
    resetPendingLoginIfAbandonedRef.current = resetPendingLoginIfAbandoned;
    useEffect(() => {
        resetPendingLoginIfAbandonedRef.current();
    }, []);

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                isStartingLoginRef.current = false;
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

        const timeoutId = window.setTimeout(clearAbandonedLogin, LOGIN_PENDING_TIMEOUT_MS);
        return () => window.clearTimeout(timeoutId);
    }, [clearAbandonedLogin, isLoginRedirecting]);

    return { startLogin, isLoginRedirecting };
};
