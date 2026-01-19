import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/animations/perspective-subtle.css";

interface IconButtonProps {
    icon: React.ReactNode; // The icon to display
    label: string; // Tooltip label
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Optional click handler
    color?: "blue" | "red" | "green" | "orange" | "gray" | "sky" | "yellow" | "white"; // Predefined color options
    overwriteClassName?: string; // Optional className to overwrite default styles
}

const IconButton: React.FC<IconButtonProps> = ({
    icon,
    label,
    onClick,
    color = "blue",
    overwriteClassName = undefined,
}) => {
    const baseClasses =
        "flex items-center justify-center p-2 ml-2 rounded-md shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const colors = {
        blue: "text-blue-600 bg-blue-100 hover:bg-blue-200 focus:ring-blue-400",
        sky: "text-sky-600 bg-sky-100 hover:bg-sky-200 focus:ring-sky-400",
        red: "text-red-600 bg-red-100 hover:bg-red-200 focus:ring-red-400",
        green: "text-green-600 bg-green-100 hover:bg-green-200 focus:ring-green-400",
        orange: "text-orange-600 bg-orange-100 hover:bg-orange-200 focus:ring-orange-400",
        gray: "text-gray-600 bg-gray-100 hover:bg-gray-200 focus:ring-gray-400",
        yellow: "text-yellow-600 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-400",
        white: "text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-300",
    };
    const className = overwriteClassName ? overwriteClassName : `${baseClasses} ${colors[color]}`;
    return (
        <Tippy
            content={
                <label className="p-2 max-w-xs rounded-lg shadow-lg bg-white/30 backdrop-blur-lg text-black text-sm font-semibold text-center border border-white/2">
                    {label}
                </label>
            }
            placement="top"
            arrow={true}
            animation="perspective-subtle"
        >
            <button onClick={onClick} className={className} aria-label={label}>
                {icon}
            </button>
        </Tippy>
    );
};

export default IconButton;
