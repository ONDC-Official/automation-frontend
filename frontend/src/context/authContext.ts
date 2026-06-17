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
import { AuthService } from "@services/authService";
import { authTokenManager } from "@utils/localStorageManager";
import { ROUTES } from "@/constants/routes";

export interface IProps {
    isAuthLoading: boolean;
    user?: IUser;
    getUser: () => Promise<void>;
}

export const AuthContext: Context<IProps> = createContext<IProps>({} as IProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<IUser | undefined>(undefined);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

    const getUser = useCallback(async () => {
        if (!authTokenManager.get()) {
            setUser(undefined);
            setIsAuthLoading(false);
            return;
        }

        const currentUser = await AuthService.getUser();
        setUser(currentUser || undefined);
        setIsAuthLoading(false);
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const oauthCode = queryParams.get("code");

        if (!oauthCode) {
            return;
        }

        const exchangeCodeAndPersistToken = async () => {
            setIsAuthLoading(true);
            await AuthService.exchangeCodeForToken(oauthCode);
            await getUser();
            navigate(ROUTES.HOME, { replace: true });
        };

        exchangeCodeAndPersistToken();
    }, [location.search, navigate, getUser]);

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
