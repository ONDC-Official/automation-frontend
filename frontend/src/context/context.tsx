import { ReactNode, useState } from "react";
import { SessionCache } from "@/types/session-types";
import { SessionContext } from "@context/sessionContext";

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<string>("");
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionCache | null>(null);
  const [selectedTab, setSelectedTab] = useState<"Request" | "Response" | "Metadata" | "Guide">(
    "Request"
  );
  const [requestData, setRequestData] = useState<unknown>(null);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [activeCallClickedToggle, setActiveCallClickedToggle] = useState<boolean>(false);
  const [sideView, setSideView] = useState<unknown>(null);
  const [metadata, setMetadata] = useState<unknown>(null);

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
        setActiveCallClickedToggle,
        activeCallClickedToggle,
        responseData,
        setResponseData,
        sideView, // 👈 optional if you also want to read it
        setSideView, // 👈 fixes missing prop
        metadata, // 👈 optional
        setMetadata,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
