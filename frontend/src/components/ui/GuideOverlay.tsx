import { ReactNode, useEffect, useRef } from "react";
import { useGuide } from "./../../context/guideContext";

interface GuideOverlayProps {
  currentStep: number;
  children: ReactNode;
  instruction: string;
  handleGoClick: () => void;
  top?: number;
  left?: number;
  right?: number;
}

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
    if (guideStep !== 0 && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [guideStep]);

  if (currentStep !== guideStep || guideStep === 0) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <div ref={containerRef} className={`relative z-[52]`}>
        {children}

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
              onClick={() => setGuideStep(0)}
            >
              Skip
            </button>
            <button
              className="text-sm px-3 py-1 rounded bg-sky-500 text-white hover:bg-sky-600"
              onClick={handleGoClick}
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
