import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@store/hooks";
import { useExchangeCodeMutation } from "@store/api";
import { setAuthLoading } from "@store/slices/authSlice";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@hooks/useAuth";

/** Bootstraps auth on app load and handles the OAuth code-exchange redirect. */
export const AuthBootstrap = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { refreshUser } = useAuth();
    const [exchangeCode] = useExchangeCodeMutation();

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        const oauthCode = new URLSearchParams(location.search).get("code");
        if (!oauthCode) {
            return;
        }

        const exchangeCodeAndLoadUser = async () => {
            dispatch(setAuthLoading(true));
            await exchangeCode({ code: oauthCode });
            await refreshUser();
            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndLoadUser();
    }, [location.search, navigate, refreshUser, exchangeCode, dispatch]);

    return null;
};
