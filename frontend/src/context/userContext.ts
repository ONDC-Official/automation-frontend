import { Context, createContext } from "react";
import { SubscriberData } from "../components/registry-components/registry-types";
import { IUser } from "@/types/user";

interface UserContextProps {
    isLoggedIn: boolean;
    userDetails?: IUser;
    refreshUser: () => Promise<void>;
    subscriberData: SubscriberData;
    setSubscriberData: React.Dispatch<React.SetStateAction<SubscriberData>>;
}

export const UserContext: Context<UserContextProps> = createContext<UserContextProps>(
    {} as UserContextProps
);
