import React from "react";
import Heading from "./mini-components/ondc-gradient-text";

interface InfoCardProps {
	title: string;
	data: Record<string, string>;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, data }) => {
	return (
		// <div className="w-full rounded-lg shadow-sm bg-gray-50 border border-gray-200 p-4">
		<div className="w-full bg-white/10 backdrop-blur-md rounded-md p-6 shadow-lg">
			<Heading size="text-xl" className=" mb-4">
				{title}
			</Heading>
			<div className="flex flex-wrap gap-4">
				{Object.entries(data).map(([key, value], index) => (
					<div
						key={index}
						className="flex items-center justify-between bg-white rounded-md shadow p-2 w-full sm:w-auto sm:flex-1"
					>
						<span className="text-sm font-bold text-sky-700">{key}</span>
						<span className="text-sm text-gray-800 font-medium ml-2">
							{value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default InfoCard;
