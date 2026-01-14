import { createContext, useContext } from "react";
import { GuideContextValue } from "@context/guide/types";

// Create context with undefined default to ensure proper usage
export const GuideContext = createContext<GuideContextValue | undefined>(undefined);

// Custom hook to consume the context
const useGuide = (): GuideContextValue => {
  const context = useContext(GuideContext);
  if (context === undefined) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
};

export default useGuide;
