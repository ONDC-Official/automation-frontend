import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
    dashboardApi,
    useDashboardLoginMutation,
    useDashboardLogoutMutation,
    useGetDashboardMeQuery,
} from "@store/api";
import { useAppDispatch } from "@store/hooks";
import { signedIn, signedOut } from "@store/slices/businessDashboardSlice";
import { DASHBOARD_ROOT } from "@pages/business-dashboard/constants";
import type { LoginRequest } from "@pages/business-dashboard/services/types";
import type { IAxiosBaseQueryError } from "@store/api";

/**
 * `GET /dashboard/auth/me`. The session is an httpOnly cookie the browser cannot
 * read, so this is the only way to learn whether it is still valid.
 */
export const useMe = () => useGetDashboardMeQuery();

/**
 * Reconciles the persisted flag with the server's answer, so a cookie that
 * expired while the tab was closed doesn't leave a stale `isAuthenticated: true`
 * in localStorage. Called once from the shell.
 */
export function useSyncSession() {
    const dispatch = useAppDispatch();
    const query = useMe();
    const { data, error } = query;

    useEffect(() => {
        if (data) {
            dispatch(data.authenticated ? signedIn() : signedOut());
            return;
        }
        // Only an authoritative rejection ends the session. A network failure or
        // a 5xx means we do not know, and bouncing to the password card on a
        // flaky connection would be worse than leaving the persisted flag alone.
        const status = (error as IAxiosBaseQueryError | undefined)?.status;
        if (status === 401 || status === 403) {
            dispatch(signedOut());
        }
    }, [data, error, dispatch]);

    return query;
}

/**
 * `POST /dashboard/auth/login` — 204 plus a `Set-Cookie`; nothing to read off
 * the body.
 */
export function useLogin() {
    const dispatch = useAppDispatch();
    const [login] = useDashboardLoginMutation();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginRequest>({ defaultValues: { password: "" } });

    const onSubmit = handleSubmit(async (values) => {
        try {
            await login(values).unwrap();
            dispatch(signedIn());
            toast.success("Signed in");
            // No navigation: the shell gates in place, so signing in reveals
            // whatever dashboard URL the user actually asked for.
        } catch (error) {
            const { status, message } = (error ?? {}) as IAxiosBaseQueryError;
            setError("root", {
                message:
                    status === 401 || status === 403
                        ? "That password is not right."
                        : (message ?? "Something went wrong"),
            });
        }
    });

    return { register, onSubmit, errors, isSubmitting };
}

/**
 * `POST /dashboard/auth/logout` — clears the cookie server-side and the cached
 * dashboard data client-side.
 */
export function useLogout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [logoutRequest, { isLoading: isPending }] = useDashboardLogoutMutation();

    const logout = () => {
        void logoutRequest()
            .unwrap()
            .catch(() => {
                // As far as this browser is concerned the session is over either
                // way; failing to reach the server must not strand the user on a
                // dashboard it can no longer load.
            })
            .finally(() => {
                dispatch(signedOut());
                dispatch(dashboardApi.util.resetApiState());
                navigate(DASHBOARD_ROOT, { replace: true });
            });
    };

    return { logout, isPending };
}
