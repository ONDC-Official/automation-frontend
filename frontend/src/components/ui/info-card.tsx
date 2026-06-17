import type { ReactNode } from "react";

interface IInfoCardProps {
    title: string;
    data: Record<string, string>;
    children?: ReactNode;
}

const InfoCard = ({ title, data, children }: IInfoCardProps) => (
    <div className="w-full rounded-md border border-gray-200 bg-gray-100 p-4 backdrop-blur-md">
        <div className="mb-4">
            <div className="flex items-center gap-1 text-xl font-bold text-sky-700">
                {title}
                {children}
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
            {Object.entries(data).map(([key, value]) => (
                <div
                    key={key}
                    className="flex w-full items-center justify-between rounded-md bg-white p-2 shadow-xs sm:w-auto"
                >
                    <span className="whitespace-nowrap text-sm font-extrabold text-sky-700">
                        {key}
                    </span>
                    <span className="ml-2 truncate text-sm font-medium text-gray-800">{value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default InfoCard;
