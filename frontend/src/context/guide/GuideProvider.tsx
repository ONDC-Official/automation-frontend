// /* eslint-disable react-refresh/only-export-components */
import { useState, ReactNode } from "react";
import { GuideStepsEnums, GuideContextValue } from "@context/guide/types";
import { GuideContext } from "@context/guide/useGuide";

export const GuideProvider = ({ children }: { children: ReactNode }) => {
  const [guideStep, setGuideStep] = useState<GuideStepsEnums>(GuideStepsEnums.Skip);

  const value: GuideContextValue = {
    guideStep,
    setGuideStep,
  };

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
};
