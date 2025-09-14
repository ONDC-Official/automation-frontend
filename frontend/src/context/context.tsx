import {
	createContext,
	ReactNode,
	useContext,
	useState,
	Dispatch,
	SetStateAction,
  } from "react";
  import { SessionCache } from "../types/session-types";
  
  interface SessionContextProps {
	sessionId: string;
	setSessionId: Dispatch<SetStateAction<string>>;
	activeFlowId: string | null;
	setActiveFlowId?: Dispatch<SetStateAction<string | null>>;
	sessionData: SessionCache | null | undefined;
	setSessionData?: Dispatch<SetStateAction<SessionCache | null>>;
	selectedTab: "Request" | "Response";
	setSelectedTab?: Dispatch<SetStateAction<"Request" | "Response">>;
	requestData: any;
	setRequestData: Dispatch<SetStateAction<any>>;
	responseData: any;
	setResponseData: Dispatch<SetStateAction<any>>;
	// custom flow variables
	cfSessionId: string;
	setcfSessionId: Dispatch<SetStateAction<string>>;
	cfActiveFlowId: string | null;
	setcfActiveFlowId?: Dispatch<SetStateAction<string | null>>;
	cfSessionData: SessionCache | null | undefined;
	setcfSessionData?: Dispatch<SetStateAction<SessionCache | null>>;
	cfSelectedTab: "Request" | "Response";
	setcfSelectedTab?: Dispatch<SetStateAction<"Request" | "Response">>;
	cfRequestData: any;
	setcfRequestData: Dispatch<SetStateAction<any>>;
	cfResponseData: any;
	setcfResponseData: Dispatch<SetStateAction<any>>;
  }
  
  export const SessionContext = createContext<SessionContextProps | undefined>(
	undefined
  );
  
  export const SessionProvider = ({ children }: { children: ReactNode }) => {
	const [sessionId, setSessionId] = useState<string>("");
	const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
	const [sessionData, setSessionData] = useState<SessionCache | null>(null);
	const [selectedTab, setSelectedTab] = useState<"Request" | "Response">(
	  "Request"
	);
	const [requestData, setRequestData] = useState<any>(null);
	const [responseData, setResponseData] = useState<any>(null);
	// custom flow state
	const [cfSessionId, setcfSessionId] = useState<string>("");
	const [cfActiveFlowId, setcfActiveFlowId] = useState<string | null>(null);
	const [cfSessionData, setcfSessionData] = useState<SessionCache | null>(null);
	const [cfSelectedTab, setcfSelectedTab] = useState<"Request" | "Response">(
	  "Request"
	);
	const [cfRequestData, setcfRequestData] = useState<any>(null);
	const [cfResponseData, setcfResponseData] = useState<any>(null);
  
	return (
	  <SessionContext.Provider
		value={{
		  sessionId,
		  setSessionId,
		  activeFlowId,
		  setActiveFlowId,
		  sessionData,
		  setSessionData,
		  selectedTab,
		  setSelectedTab,
		  requestData,
		  setRequestData,
		  responseData,
		  setResponseData,

		  cfSessionId,
		  setcfSessionId,
		  cfActiveFlowId,
		  setcfActiveFlowId,
		  cfSessionData,
		  setcfSessionData,
		  cfSelectedTab,
		  setcfSelectedTab,
		  cfRequestData,
		  setcfRequestData,
		  cfResponseData,
		  setcfResponseData,
		}}
	  >
		{children}
	  </SessionContext.Provider>
	);
  };
  
  export const useSession = () => {
	const ctx = useContext(SessionContext);
	if (!ctx) throw new Error("useSession must be used inside SessionProvider");
	return ctx;
  };
  