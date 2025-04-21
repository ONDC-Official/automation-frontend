// import React, { useState, ReactNode } from "react";
// import "../../styles/flip.css";

// interface FlippableCardProps {
// 	front: ReactNode;
// 	back: ReactNode;
// 	flipped?: boolean; // Optional for controlled mode
// 	onFlip?: (flipped: boolean) => void; // Optional callback
// 	className?: string; // Optional for custom styling
// }

// const FlippableCard: React.FC<FlippableCardProps> = ({
// 	front,
// 	back,
// 	flipped: flippedProp,
// 	onFlip,
// 	className = "",
// }) => {
// 	const [internalFlipped, setInternalFlipped] = useState(false);

// 	const isControlled = flippedProp !== undefined;
// 	const isFlipped = isControlled ? flippedProp : internalFlipped;

// 	const handleClick = () => {
// 		if (isControlled) {
// 			onFlip?.(!flippedProp);
// 		} else {
// 			setInternalFlipped((prev) => !prev);
// 		}
// 	};

// 	return (
// 		<div
// 			className={`flip-card ${isFlipped ? "flipped" : ""} ${className}`}
// 			onClick={handleClick}
// 		>
// 			<div className="flip-card-inner">
// 				<div className="flip-card-front">{front}</div>
// 				<div className="flip-card-back">{back}</div>
// 			</div>
// 		</div>
// 	);
// };

// export default FlippableCard;

import React, { useEffect, useState, ReactNode } from "react";
import "../../styles/flip.css";
interface FlippableWrapperProps {
	children: ReactNode;
	flipTrigger: any; // This is what causes the flip (like your `status`)
}

const FlippableWrapper: React.FC<FlippableWrapperProps> = ({
	children,
	flipTrigger,
}) => {
	const [flipping, setFlipping] = useState(false);

	useEffect(() => {
		setFlipping(true);
		const timeout = setTimeout(() => setFlipping(false), 200); // duration of flip
		return () => clearTimeout(timeout);
	}, [flipTrigger]);

	return (
		<div
			className={`flip-wrapper ${flipping ? "spin-once" : ""} w-full h-full`}
		>
			<div className="flip-inner w-full h-full">{children}</div>
		</div>
	);
};

export default FlippableWrapper;
