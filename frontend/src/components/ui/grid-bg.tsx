// src/components/GridBackground.tsx
import React from "react";
import "../../styles/styles.css";

interface GridBackgroundProps {
	children: React.ReactNode;
}

const GridBackground: React.FC<GridBackgroundProps> = ({ children }) => {
	return <div className="grid-background min-h-screen w-full">{children}</div>;
};

export default GridBackground;
