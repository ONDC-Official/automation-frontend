import { Context, createContext } from "react";
import { UserDetails } from "../components/top-bar";
import { SubscriberData } from "../components/registry-components/registry-types";

interface UserContextProps {
	isLoggedIn: boolean;
	// setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
	userDetails?: UserDetails;
	refreshUser: () => Promise<void>;
	subscriberData: SubscriberData;
	setSubscriberData: React.Dispatch<React.SetStateAction<SubscriberData>>;
}

export const UserContext: Context<UserContextProps> =
	createContext<UserContextProps>({} as UserContextProps);
