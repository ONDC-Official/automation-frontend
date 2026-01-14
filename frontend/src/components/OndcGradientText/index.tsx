import { FC, ReactNode } from "react";

interface IOndcGradientTextProps {
  as?: keyof JSX.IntrinsicElements; // For dynamic heading tags like h1, h2, h3
  size?: string; // For custom font size
  gradientFrom?: string; // Gradient start color
  gradientTo?: string; // Gradient end color
  children: ReactNode;
  className?: string; // Additional Tailwind classes
}

const OndcGradientText: FC<IOndcGradientTextProps> = ({
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
export default OndcGradientText;
