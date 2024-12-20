import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Heading from "./mini-components/ondc-gradient-text";

interface SidebarHeaderProps {
	isOpen: boolean;
	toggle: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isOpen, toggle }) => {
	return (
		<div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
			<Heading
				className={`text-xl font-semibold text-gray-800 transition-all duration-300 ${
					isOpen ? "opacity-100" : "opacity-0 translate-x-[-10px]"
				}`}
			>
				{isOpen && "Menu"}
			</Heading>
			<button
				onClick={toggle}
				className="p-2 rounded-full border border-sky-500 hover:bg-blue-100 text-sky-500 hover:text-blue-600 transition-all duration-300 shadow-sm"
				aria-label="Toggle Sidebar"
			>
				{isOpen ? <FaChevronLeft size={18} /> : <FaChevronRight size={18} />}
			</button>
		</div>
	);
};

export default SidebarHeader;
