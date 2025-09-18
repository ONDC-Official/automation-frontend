import { ReactNode, useEffect, useRef } from "react";

interface GuideOverlayProps {
  children: ReactNode;
  instruction: string;
  handleGoClick: () => void;
}

export default function GuideOverlay({
  children,
  instruction,
  handleGoClick,
}: GuideOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const guideStep = 0;

  useEffect(() => {
    if (guideStep !== 0 && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [guideStep]);

  return (
    <div
      ref={containerRef}
      className={`relative ${guideStep !== 0 ? "z-50" : ""}`}
    >
      {children}
      {guideStep !== 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"></div>
      )}
      {guideStep !== 0 && (
        <div className="absolute top-14 right-0 bg-white shadow-lg border rounded-lg p-3 w-56 z-50">
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
      )}
    </div>
  );
}
