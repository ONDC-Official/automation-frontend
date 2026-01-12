import { useEffect, useRef, useState } from "react";
import { ICircularProgressProps } from "@components/CircularProgress/types";

const CircularProgress: React.FC<ICircularProgressProps> = ({
  strokeWidth = 10,
  sqSize = 120,
  duration = 5,
  onComplete,
  loop,
  isActive = true,
  id,
}) => {
  const radius = (sqSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [progress, setProgress] = useState<number>(() => {
    if (id) {
      const storedProgress = Number(localStorage.getItem(id));
      return isNaN(storedProgress) ? 0 : storedProgress;
    }
    return 0;
  });

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  const isRunning = useRef(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      isRunning.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    if (pauseRef.current) return;
    isRunning.current = true;

    const savedElapsed = id ? Number(localStorage.getItem(`${id}_elapsed`)) || 0 : 0;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!isRunning.current || !isMounted.current) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - savedElapsed * 1000;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const currentProgress = Math.min(elapsed / duration, 1);

      setProgress(currentProgress);

      if (id) {
        localStorage.setItem(id, String(currentProgress));
        localStorage.setItem(`${id}_elapsed`, String(elapsed));
      }

      if (currentProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        isRunning.current = false;

        // Clear storage
        if (id) {
          localStorage.removeItem(id);
          localStorage.removeItem(`${id}_elapsed`);
        }
        pauseRef.current = true;
        onComplete().finally(() => {
          if (!isMounted.current) return;

          isRunning.current = false;
          startTimeRef.current = null;
          pauseRef.current = false;
          if (id) {
            localStorage.removeItem(`${id}_startTime`);
            localStorage.removeItem(`${id}_cycleId`);
          }
        });
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isRunning.current = false;
    };
  }, [duration, loop, onComplete, isActive, id]);

  const strokeDashoffset = circumference * (1 - progress);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center p-2 ml-2 rounded-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sky-700 ease-in">
      <svg width={sqSize} height={sqSize}>
        <circle
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          stroke="#e6e6e6"
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          stroke="#0369a1"
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default CircularProgress;
