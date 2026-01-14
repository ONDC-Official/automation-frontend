import React from "react";

interface HeadingProps {
	as?: keyof JSX.IntrinsicElements; // For dynamic heading tags like h1, h2, h3
	size?: string; // For custom font size
	gradientFrom?: string; // Gradient start color
	gradientTo?: string; // Gradient end color
	children: React.ReactNode;
	className?: string; // Additional Tailwind classes
}

const Heading: React.FC<HeadingProps> = ({
	as: Tag = "h2",
	size = "text-2xl",
	gradientFrom = "from-sky-600",
	gradientTo = "to-sky-400",
	children,
	className = "",
}) => {
	return (
		<Tag
			className={`text-transparent bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text ${size} ${className}`}
			style={{
				fontWeight: 1000, // Ensure ultra-bold weight
			}}
		>
			{children}
		</Tag>
	);
};
export default Heading;
