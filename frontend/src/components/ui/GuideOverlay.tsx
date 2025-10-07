import {
  ReactNode,
  useEffect,
  useRef,
  cloneElement,
  isValidElement,
  ReactElement
} from "react";
import { GuideStepsEnums, useGuide } from "./../../context/guideContext";
interface GuideOverlayProps {
  currentStep: GuideStepsEnums;
  children: ReactNode;
  instruction: string;
  handleGoClick: () => void;
  top?: number;
  left?: number;
  right?: number;
}

interface InteractiveElementProps {
  onClick?: (...args: any[]) => void;
  // You might want to add other common props like 'disabled', 'id', etc.
}

const journey = [
  GuideStepsEnums.Reg1,
  GuideStepsEnums.Reg2,
  GuideStepsEnums.Reg3,
  GuideStepsEnums.Reg4,
  GuideStepsEnums.Reg5,
  GuideStepsEnums.Reg6,
  GuideStepsEnums.Reg7,
  GuideStepsEnums.Reg8,
  GuideStepsEnums.Reg9,
  GuideStepsEnums.Reg10,
  GuideStepsEnums.Reg11,
  GuideStepsEnums.Reg12,
  GuideStepsEnums.Test1
];

export default function GuideOverlay({
  currentStep,
  children,
  instruction,
  handleGoClick,
  top,
  left,
  right,
}: GuideOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { guideStep, setGuideStep } = useGuide();

  useEffect(() => {
    if (guideStep !== GuideStepsEnums.Skip && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [guideStep]);

  const handleNextStep = () => {
    const currentIndex = journey.indexOf(currentStep);

    if (currentIndex !== -1 && currentIndex < journey.length - 1) {
      setGuideStep(journey[currentIndex + 1]);
    } else {
      setGuideStep(GuideStepsEnums.Skip);
    }
  };

  const childWithClickHandler = isValidElement(children)
    ? cloneElement(children as ReactElement<InteractiveElementProps>, {
        onClick: (...args: any[]) => {
          if (children.props.onClick) {
            children.props.onClick?.(...args);
          }

          handleNextStep();
        },
      })
    : children;

  if (currentStep !== guideStep || guideStep === GuideStepsEnums.Skip) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <div ref={containerRef} className={`relative z-[52]`}>
        {childWithClickHandler}
        <div
          style={{
            top: top !== undefined ? `${top}px` : "auto",
            left: left !== undefined ? `${left}px` : "auto",
            right: right !== undefined ? `${right}px` : "auto",
          }}
          className={`absolute  bg-white shadow-lg border rounded-lg p-3 w-56 z-50`}
        >
          <p className="text-gray-700 font-medium">{instruction}</p>
          <div className="flex justify-end mt-2 space-x-2">
            <button
              className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => setGuideStep(GuideStepsEnums.Skip)}
            >
              Skip
            </button>
            <button
              className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
              onClick={() => {
                handleNextStep();
                handleGoClick();
              }}
            >
              Go
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[51] backdrop-blur-sm"></div>
    </div>
  );
}