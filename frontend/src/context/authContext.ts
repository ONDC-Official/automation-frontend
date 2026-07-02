import { Context, ReactNode, createContext, createElement, useCallback, useEffect } from "react";
import { IUser } from "@/types/user";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthService } from "@services/authService";
import { authTokenManager } from "@utils/localStorageManager";
import { ROUTES } from "@/constants/routes";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    selectAuthUser,
    selectIsAuthLoading,
    setUser,
    setAuthLoading,
} from "@store/slices/authSlice";

export interface IProps {
    isAuthLoading: boolean;
    user?: IUser;
    getUser: () => Promise<void>;
}

export const AuthContext: Context<IProps> = createContext<IProps>({} as IProps);

/**
 * Thin shell over the Redux `auth` slice. `user`/`isAuthLoading` live in the store; the OAuth
 * exchange and `AuthService.getUser()` effects (the API layer) are unchanged — only their result
 * setters now dispatch to Redux instead of local useState.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectAuthUser);
    const isAuthLoading = useAppSelector(selectIsAuthLoading);

    const getUser = useCallback(async () => {
        if (!authTokenManager.get()) {
            dispatch(setUser(undefined));
            dispatch(setAuthLoading(false));
            return;
        }

        const currentUser = await AuthService.getUser();
        dispatch(setUser(currentUser || undefined));
        dispatch(setAuthLoading(false));
    }, [dispatch]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const oauthCode = queryParams.get("code");

        if (!oauthCode) {
            return;
        }

        const exchangeCodeAndPersistToken = async () => {
            dispatch(setAuthLoading(true));
            await AuthService.exchangeCodeForToken(oauthCode);
            await getUser();
            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndPersistToken();
    }, [location.search, navigate, getUser, dispatch]);

    useEffect(() => {
        getUser();
    }, [getUser]);

    return createElement(
        AuthContext.Provider,
        {
            value: {
                isAuthLoading,
                user,
                getUser,
            },
        },
        children
    );
};
