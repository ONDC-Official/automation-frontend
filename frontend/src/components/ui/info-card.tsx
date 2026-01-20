import React from "react";
// import Heading from "./mini-components/ondc-gradient-text";

interface InfoCardProps {
    title: string;
    data: Record<string, string>;
    children?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, data, children }) => {
    return (
        // <div className="w-full rounded-lg shadow-sm bg-gray-50 border border-gray-200 p-4">
        <div className="w-full bg-gray-100 backdrop-blur-md rounded-md border border-gray-200 p-4">
            <div className="mb-4">
                <div className="flex items-center gap-1 text-sky-700 font-bold text-xl">
                    {title}
                    {children}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {Object.entries(data).map(([key, value], index) => (
                    <div
                        key={index}
                        // --- THE FIX IS HERE ---
                        // This now correctly says:
                        // - Be full-width by default (for mobile).
                        // - Switch to auto-width at the 'sm' breakpoint and up.
                        className="flex items-center justify-between bg-white rounded-md shadow-sm p-2 w-full sm:w-auto"
                    >
                        <span className="text-sm font-extrabold text-sky-700 whitespace-nowrap">
                            {key}
                        </span>
                        {/* I've added the robust truncation from before, as it's still a good idea! */}
                        <span className="text-sm text-gray-800 font-medium ml-2 truncate">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InfoCard;
