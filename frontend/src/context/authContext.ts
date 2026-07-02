import {
    Context,
    ReactNode,
    createContext,
    createElement,
    useCallback,
    useEffect,
    useState,
} from "react";
import { IUser } from "@/types/user";
import { useLocation, useNavigate } from "react-router-dom";
import { useLazyGetMeQuery, useExchangeCodeMutation } from "@store/api";
import { authTokenManager } from "@utils/localStorageManager";
import { ROUTES } from "@/constants/routes";

export interface IProps {
    isAuthLoading: boolean;
    user?: IUser;
    getUser: () => Promise<void>;
}

export const AuthContext: Context<IProps> = createContext<IProps>({} as IProps);

/**
 * `user`/`isAuthLoading` are kept as local state (not Redux) since they're just a synthesized view
 * over the `getMe` RTK Query call — the query cache is already the source of truth via
 * `useLazyGetMeQuery`, so mirroring its result into the store would duplicate it. Local state (not
 * the query's own `result`) is still needed because `getUser()` must be able to reset `user` to
 * `undefined` on missing/cleared token without re-querying.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<IUser | undefined>(undefined);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [triggerGetMe] = useLazyGetMeQuery();
    const [exchangeCode] = useExchangeCodeMutation();

    const getUser = useCallback(async () => {
        if (!authTokenManager.get()) {
            setUser(undefined);
            setIsAuthLoading(false);
            return;
        }

        const result = await triggerGetMe();
        const currentUser = result.data?.ok && result.data.user ? result.data.user : undefined;
        setUser(currentUser);
        setIsAuthLoading(false);
    }, [triggerGetMe]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const oauthCode = queryParams.get("code");

        if (!oauthCode) {
            return;
        }

        const exchangeCodeAndPersistToken = async () => {
            setIsAuthLoading(true);
            await exchangeCode({ code: oauthCode });
            await getUser();
            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndPersistToken();
    }, [location.search, navigate, getUser, exchangeCode]);

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
