import { Context, createContext } from "react";
import { SubscriberData } from "../components/registry-components/registry-types";
import { IUser } from "@/types/user";

export interface IUserContextProps {
    isLoggedIn: boolean;
    isAuthLoading: boolean;
    userDetails?: IUser;
    refreshUser: () => Promise<void>;
    subscriberData: SubscriberData;
    setSubscriberData: React.Dispatch<React.SetStateAction<SubscriberData>>;
}

export const UserContext: Context<IUserContextProps> = createContext<IUserContextProps>(
    {} as IUserContextProps
);
