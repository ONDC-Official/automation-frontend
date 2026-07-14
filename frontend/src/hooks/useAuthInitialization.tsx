import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, useAppStore } from "@store/hooks";
import { useExchangeCodeMutation, useGetMeQuery } from "@store/api";
import {
    selectAuthToken,
    selectPostLoginRedirect,
    setPostLoginRedirect,
} from "@store/slices/authSlice";
import { ROUTES } from "@constants/routes";

/** Bootstraps auth on app load and handles the OAuth code-exchange redirect. */
export const AuthInitializer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const store = useAppStore();
    const token = useAppSelector(selectAuthToken);
    const [exchangeCode] = useExchangeCodeMutation();

    // Keep a root subscription so `getMe` runs whenever a token is present.
    useGetMeQuery(undefined, { skip: !token });

    useEffect(() => {
        const oauthCode = new URLSearchParams(location.search).get("code");
        if (!oauthCode) {
            return;
        }

        let cancelled = false;

        const exchangeCodeAndNavigate = async () => {
            // Read before exchange — abandoned-login cleanup must not race-clear it mid-flight.
            const destination = selectPostLoginRedirect(store.getState()) || ROUTES.HOME;
            await exchangeCode({ code: oauthCode });
            if (cancelled) {
                return;
            }
            dispatch(setPostLoginRedirect(null));
            navigate(destination, { replace: true });
        };

        exchangeCodeAndNavigate();
        return () => {
            cancelled = true;
        };
    }, [location.search, navigate, exchangeCode, dispatch, store]);

    return null;
};
