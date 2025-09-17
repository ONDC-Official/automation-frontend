import { Context, createContext } from "react";
import { SessionCache } from "../types/session-types";

interface SessionContextProps {
	sessionId: string;
	activeFlowId: string | null;
	sessionData: SessionCache | null | undefined;
	selectedTab: "Request" | "Response" |  "Metadata";
	setRequestData: React.Dispatch<React.SetStateAction<any>>;
	setResponseData: React.Dispatch<React.SetStateAction<any>>;
	setSideView: React.Dispatch<React.SetStateAction<any>>;
	setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const SessionContext: Context<SessionContextProps> =
	createContext<SessionContextProps>({} as SessionContextProps);
