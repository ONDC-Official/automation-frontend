import { useMemo } from "react";
import { ICircleProps } from "@components/AnimatedCircles/types";
import {
  CIRCLE_COUNT,
  MIN_SIZE,
  SIZE_INCREMENT,
  SIZE_VARIATIONS,
  MIN_ANIMATION_DURATION,
  MAX_ANIMATION_DURATION,
} from "@components/AnimatedCircles/constants";

const Circle = ({ top, left, size, animationDuration }: ICircleProps) => (
  <div
    className="absolute bg-gray-300 opacity-20 rounded-full animate-bounce-fast"
    style={{
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${animationDuration}s`,
    }}
    aria-hidden="true"
  />
);

const AnimatedCircles = () => {
  // Generate circles with stable positions and sizes using useMemo
  const circles = useMemo(() => {
    return Array.from({ length: CIRCLE_COUNT }, (_, index) => {
      const size = MIN_SIZE + (index % SIZE_VARIATIONS) * SIZE_INCREMENT;
      return {
        id: index,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size,
        animationDuration:
          MIN_ANIMATION_DURATION +
          Math.random() * (MAX_ANIMATION_DURATION - MIN_ANIMATION_DURATION),
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none grid grid-cols-6 gap-2" aria-hidden="true">
      {circles.map((circle) => (
        <Circle
          key={circle.id}
          top={circle.top}
          left={circle.left}
          size={circle.size}
          animationDuration={circle.animationDuration}
        />
      ))}
    </div>
  );
};

export default AnimatedCircles;
