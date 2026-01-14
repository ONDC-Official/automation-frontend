import { ReactNode } from "react";
import { GuideStepsEnums } from "@/context/guide/types";

export interface GuideOverlayProps {
  currentStep: GuideStepsEnums;
  children: ReactNode;
  instruction: string;
  handleGoClick: () => void;
  top?: number;
  left?: number;
  right?: number;
}

export interface InteractiveElementProps {
  onClick?: (...args: unknown[]) => void;
  // You might want to add other common props like 'disabled', 'id', etc.
}
