import { createContext, ReactNode, useContext, useState, Dispatch, SetStateAction } from "react";

export enum GuideStepsEnums {
  Skip = "Skip",
  // Regestration Flow
  Reg1 = "Reg-1",
  Reg2 = "Reg-2",
  Reg3 = "Reg-3",
  Reg4 = "Reg-4",
  Reg5 = "Reg-5",
  Reg6 = "Reg-6",
  Reg7 = "Reg-7",
  Reg8 = "Reg-8",
  Reg9 = "Reg-9",
  Reg10 = "Reg-10",
  Reg11 = "Reg-11",
  Reg12 = "Reg-12",
  // Scenario Testing flow
  Test1 = "Test-1",
}

interface GuideContextProps {
  guideStep: GuideStepsEnums;
  setGuideStep: Dispatch<SetStateAction<GuideStepsEnums>>;
}

export const GuideContext = createContext<GuideContextProps | undefined>(undefined);

export const GuideProvider = ({ children }: { children: ReactNode }) => {
  const [guideStep, setGuideStep] = useState<GuideStepsEnums>(GuideStepsEnums.Skip);

  return (
    <GuideContext.Provider
      value={{
        guideStep,
        setGuideStep,
      }}>
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used inside GuideProvider");
  return ctx;
};
