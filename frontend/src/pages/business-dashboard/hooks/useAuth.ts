import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import httpClient from "@pages/business-dashboard/services/httpClient";
import type { ApiError } from "@pages/business-dashboard/services/httpClient";
import type { LoginRequest, MeResponse } from "@pages/business-dashboard/services/types";
import { useAppDispatch } from "@store/hooks";
import { signedIn, signedOut } from "@store/slices/businessDashboardSlice";
import { DASHBOARD_ROOT } from "@pages/business-dashboard/constants";
import { useGet } from "./useGet";
import { usePost } from "./usePost";

export const authKeys = {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
};

/**
 * `GET /dashboard/auth/me`. The session is an httpOnly cookie the browser cannot
 * read, so this is the only way to learn whether it is still valid.
 */
export function useMe() {
    return useGet<MeResponse>(
        authKeys.me,
        async () => (await httpClient.get<MeResponse>("/auth/me")).data,
        { retry: false, staleTime: 30_000 }
    );
}

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
        // Only an authoritative rejection ends the session. A network failure or a
        // 5xx means we do not know, and bouncing to /login on a flaky connection
        // would be worse than leaving the persisted flag alone.
        if (error && (error.status === 401 || error.status === 403)) {
            dispatch(signedOut());
        }
    }, [data, error, dispatch]);

    return query;
}

/** `POST /auth/login` — 204 plus a `Set-Cookie`; nothing to read off the body. */
export function useLogin() {
    const dispatch = useAppDispatch();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginRequest>({ defaultValues: { password: "" } });

    const { mutateAsync } = usePost<void, LoginRequest>(
        async (values) => {
            await httpClient.post("/auth/login", values);
        },
        { invalidates: [authKeys.me] }
    );

    const onSubmit = handleSubmit(async (values) => {
        try {
            await mutateAsync(values);
            dispatch(signedIn());
            toast.success("Signed in");
            // No navigation: the shell gates in place, so signing in reveals whatever
            // dashboard URL the user actually asked for.
        } catch (error) {
            const { status, message } = error as ApiError;
            setError("root", {
                message: status === 401 || status === 403 ? "That password is not right." : message,
            });
        }
    });

    return { register, onSubmit, errors, isSubmitting };
}

/** `POST /auth/logout` — clears the cookie server-side and the cache client-side. */
export function useLogout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    const { mutate, isPending } = usePost<void, void>(async () => {
        await httpClient.post("/auth/logout");
    });

    const logout = () =>
        mutate(undefined, {
            onSettled: () => {
                dispatch(signedOut());
                queryClient.clear();
                navigate(DASHBOARD_ROOT, { replace: true });
            },
        });

    return { logout, isPending };
}
