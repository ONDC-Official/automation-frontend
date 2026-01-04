import React from "react";

interface UserIconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export const UserIcon: React.FC<UserIconProps> = ({
  width = 32,
  height = 32,
  className = "",
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
