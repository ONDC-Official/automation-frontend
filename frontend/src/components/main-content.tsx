// src/components/MainContent.jsx
import { useState } from "react";
import Sidebar from "./side-bar";
import { FaHome } from "react-icons/fa";
import { TbTestPipe2Filled } from "react-icons/tb";
import { GoWorkflow } from "react-icons/go";
import { PiNetwork } from "react-icons/pi";

import ApiTesting from "./api-testing";
import NotFoundPage from "./ui/not-found";
import FlowContent from "./flow-testing/flow-page";

const MainContent = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar starts expanded
	const [activeTab, setActiveTab] = useState("home");
	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="flex h-full w-screen">
			{/* Sidebar */}
			<Sidebar
				isOpen={isSidebarOpen}
				toggle={toggleSidebar}
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				tabs={[
					{
						id: "home",
						label: "Discover",
						icon: <FaHome className="text-xl" />,
					},
					{
						id: "test",
						label: "Unit Api Testing",
						icon: <TbTestPipe2Filled className="text-xl" />,
					},
					{
						id: "flows",
						label: "Flow Challenges",
						icon: <GoWorkflow className="text-xl" />,
					},

					{
						id: "flowsWorkbench",
						label: "Custom Flow Workbench",
						icon: <PiNetwork className="text-xl" />,
					},
				]}
			/>

			<div
				className={`flex-1 p-2 mt-2 transition-all duration-300 ${
					isSidebarOpen ? " ml-64" : "ml-20"
				}`}
			>
				<GetMainContent activeTab={activeTab} isSidebarOpen={isSidebarOpen} />
			</div>
		</div>
	);
};

function GetMainContent({
	activeTab,
	isSidebarOpen,
}: {
	activeTab: string;
	isSidebarOpen: boolean;
}) {
	switch (activeTab) {
		case "home":
			return <h1>Add Home</h1>;
		case "flows":
			return <FlowContent />;
		case "test":
			return <ApiTesting isSidebarOpen={isSidebarOpen} />;
		default:
			return <NotFoundPage />;
	}
}

export default MainContent;
