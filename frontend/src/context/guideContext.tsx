import {
  createContext,
  ReactNode,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

interface GuideContextProps {
  guideStep: string;
  setGuideStep: Dispatch<SetStateAction<string>>;
}

export const GuideContext = createContext<GuideContextProps | undefined>(
  undefined
);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [guideStep, setGuideStep] = useState<number>(0);

  return (
    <GuideContext.Provider
      value={{
        guideStep,
        setGuideStep,
      }}
    >
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide must be used inside SessionProvider");
  return ctx;
};
