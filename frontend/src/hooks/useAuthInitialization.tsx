import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import { useExchangeCodeMutation, useGetMeQuery } from "@store/api";
import { selectAuthToken } from "@store/slices/authSlice";
import { ROUTES } from "@constants/routes";

/** Bootstraps auth on app load and handles the OAuth code-exchange redirect. */
export const AuthInitializer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = useAppSelector(selectAuthToken);
    const [exchangeCode] = useExchangeCodeMutation();

    // Keep a root subscription so `getMe` runs whenever a token is present.
    useGetMeQuery(undefined, { skip: !token });

    useEffect(() => {
        const oauthCode = new URLSearchParams(location.search).get("code");
        if (!oauthCode) {
            return;
        }

        const exchangeCodeAndNavigate = async () => {
            await exchangeCode({ code: oauthCode });
            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndNavigate();
    }, [location.search, navigate, exchangeCode]);

    return null;
};
