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

/** Strip OAuth `code` from an in-app path for the final clean navigate. */
const withoutOAuthCode = (destination: string): string => {
    const url = new URL(destination, window.location.origin);
    url.searchParams.delete("code");
    const search = url.searchParams.toString();
    return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
};

/** Prevents Strict Mode remount / effect re-entry from re-using a one-shot exchange code. */
let handledOAuthCode: string | null = null;

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

    // OAuth lands on ClientURL root (`/?code=`). Layout suppresses `<Routes />` while
    // `code` is present (no home flash). Exchange here, then navigate to the saved
    // return path without waiting for a fragile URL-equality hop.
    useEffect(() => {
        const oauthCode = new URLSearchParams(location.search).get("code");
        if (!oauthCode || handledOAuthCode === oauthCode) {
            return;
        }
        handledOAuthCode = oauthCode;

        const destination = selectPostLoginRedirect(store.getState()) || ROUTES.HOME;

        const exchangeCodeAndNavigate = async () => {
            try {
                await exchangeCode({ code: oauthCode }).unwrap();
            } catch {
                // auth.api onQueryStarted already toasts + clears pending; still leave ?code=.
            } finally {
                dispatch(setPostLoginRedirect(null));
                navigate(withoutOAuthCode(destination), { replace: true });
            }
        };

        void exchangeCodeAndNavigate();
    }, [location.search, navigate, exchangeCode, dispatch, store]);

    return null;
};
