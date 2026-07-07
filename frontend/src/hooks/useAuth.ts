import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { useGetMeQuery, devGuideApi } from "@store/api";
import { clearAuth, selectAuthToken } from "@store/slices/authSlice";
import type { IUser } from "@/types/user";

export interface UseAuthResult {
    user: IUser | undefined;
    isAuthLoading: boolean;
    token: string | null;
    /** Refetch the current user from the API (no-op when logged out). */
    refreshUser: () => Promise<void>;
    /** Alias for `refreshUser` — kept for call-site compatibility. */
    getUser: () => Promise<void>;
    logout: () => void;
}

/** Auth: token in Redux (persisted); user profile from RTK Query `getMe` cache. */
export const useAuth = (): UseAuthResult => {
    const dispatch = useAppDispatch();
    const token = useAppSelector(selectAuthToken);
    const { data, isLoading, isFetching, refetch } = useGetMeQuery(undefined, {
        skip: !token,
    });

    const user = token && data?.ok && data.user ? data.user : undefined;
    const isAuthLoading = Boolean(token && (isLoading || isFetching));

    const refreshUser = useCallback(async () => {
        if (!token) {
            return;
        }
        await refetch();
    }, [token, refetch]);

    const logout = useCallback(() => {
        dispatch(clearAuth());
        dispatch(devGuideApi.util.resetApiState());
    }, [dispatch]);

    return {
        user,
        isAuthLoading,
        token,
        refreshUser,
        getUser: refreshUser,
        logout,
    };
};
