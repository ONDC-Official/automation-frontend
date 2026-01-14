import React, { useEffect, useState } from "react";
import { IFlippableProps } from "@components/FlippableDiv/types";

const FlippableWrapper: React.FC<IFlippableProps> = ({ children, flipTrigger }) => {
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    setFlipping(true);
    const timeout = setTimeout(() => setFlipping(false), 200); // duration of flip
    return () => clearTimeout(timeout);
  }, [flipTrigger]);

  return (
    <div className={`flip-wrapper ${flipping ? "spin-once" : ""} w-full h-full`}>
      <div className="flip-inner w-full h-full">{children}</div>
    </div>
  );
};

export default FlippableWrapper;
