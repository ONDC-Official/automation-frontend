import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { useLazyGetMeQuery } from "@store/api";
import {
    clearAuth,
    selectAuthLoading,
    selectAuthToken,
    selectAuthUser,
    setAuthLoading,
    setUser,
} from "@store/slices/authSlice";
import type { IUser } from "@/types/user";

export interface UseAuthResult {
    user: IUser | undefined;
    isAuthLoading: boolean;
    token: string | null;
    /** Refetch the current user from the API (or clear user when logged out). */
    refreshUser: () => Promise<void>;
    /** Alias for `refreshUser` — kept for call-site compatibility. */
    getUser: () => Promise<void>;
    logout: () => void;
}

/** Auth state and actions — backed by `authSlice` (no Context). */
export const useAuth = (): UseAuthResult => {
    const dispatch = useAppDispatch();
    const token = useAppSelector(selectAuthToken);
    const user = useAppSelector(selectAuthUser);
    const isAuthLoading = useAppSelector(selectAuthLoading);
    const [triggerGetMe] = useLazyGetMeQuery();

    const refreshUser = useCallback(async () => {
        if (!token) {
            dispatch(setUser(undefined));
            dispatch(setAuthLoading(false));
            return;
        }

        dispatch(setAuthLoading(true));
        const result = await triggerGetMe();
        const currentUser = result.data?.ok && result.data.user ? result.data.user : undefined;
        dispatch(setUser(currentUser));
        dispatch(setAuthLoading(false));
    }, [dispatch, token, triggerGetMe]);

    const logout = useCallback(() => {
        dispatch(clearAuth());
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
