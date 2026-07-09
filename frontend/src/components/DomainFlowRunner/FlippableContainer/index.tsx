import React, { useEffect, useState, ReactNode } from "react";
import "@/styles/flip.css";

interface FlippableWrapperProps {
    children: ReactNode;
    flipTrigger: string;
}

const FlippableWrapper: React.FC<FlippableWrapperProps> = ({ children, flipTrigger }) => {
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
        setFlipping(true);
        const timeout = setTimeout(() => setFlipping(false), 200);
        return () => clearTimeout(timeout);
    }, [flipTrigger]);

    return (
        <div className={`flip-wrapper ${flipping ? "spin-once" : ""} w-full h-full`}>
            <div className="flip-inner w-full h-full">{children}</div>
        </div>
    );
};

export default FlippableWrapper;
