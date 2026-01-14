import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { SessionCache } from "@/types/session-types";

export interface SessionContextProps {
  sessionId: string;
  setSessionId: Dispatch<SetStateAction<string>>;
  activeFlowId: string | null;
  setActiveFlowId?: Dispatch<SetStateAction<string | null>>;
  sessionData: SessionCache | null | undefined;
  setSessionData?: Dispatch<SetStateAction<SessionCache | null>>;
  selectedTab: "Request" | "Response" | "Metadata" | "Guide";
  setSelectedTab?: Dispatch<SetStateAction<"Request" | "Response" | "Metadata" | "Guide">>;
  requestData: unknown;
  setRequestData: Dispatch<SetStateAction<unknown>>;
  responseData: unknown;
  setResponseData: Dispatch<SetStateAction<unknown>>;
  sideView: unknown;
  setSideView: React.Dispatch<React.SetStateAction<unknown>>;
  metadata: unknown;
  setMetadata: React.Dispatch<React.SetStateAction<unknown>>;
  setActiveCallClickedToggle: React.Dispatch<React.SetStateAction<boolean>>;
  activeCallClickedToggle: boolean;
}

export const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
};
