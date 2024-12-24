import React, { useEffect, useRef, useState } from "react";
import { FetchFlowsResponse } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import axios from "axios";
import { toast } from "react-toastify";
import { CacheSessionData } from "../../types/session-types";
import { putCacheData } from "../../utils/request-utils";
import { Accordion } from "./flow-accordian";
import Loader from "../ui/mini-components/loader";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";

interface SessionData {
	city: string;
	domain: string;
	active_session_id: string;
	type: string;
	enviroment: string;
}

function RenderFlows({
	flows,
	subUrl,
	setStep,
}: {
	flows: FetchFlowsResponse;
	subUrl: string;
	setStep: React.Dispatch<React.SetStateAction<number>>;
}) {
	const [sessionData, setSessionData] = useState<SessionData | null>(null);
	const [activeFlow, setActiveFlow] = useState<string | null>(null);
	const activeFlowRef = useRef<string | null>(activeFlow);
	const [cacheData, setCacheData] = useState<CacheSessionData | null>(null);
	const [sideView, setSideView] = useState<any>({});
	useEffect(() => {
		fetchSessionData();
	}, [subUrl]);

	useEffect(() => {
		if (activeFlow) {
			putCacheData(
				{
					flowId: activeFlow,
				},
				subUrl
			)
				.then((response) => {
					console.log("response", response.data);
				})
				.catch((e) => {
					console.error("error while sending response", e);
					toast.error("Error while updating session");
				});
		}
	}, [activeFlow, subUrl]);

	// Update the ref whenever activeFlow changes
	useEffect(() => {
		activeFlowRef.current = activeFlow;
	}, [activeFlow]);

	useEffect(() => {
		// Call fetchData initially
		fetchPayloads();

		// Set interval to call fetchData every 3 seconds
		const intervalId = setInterval(fetchPayloads, 3000);

		// Cleanup interval on component unmount
		return () => clearInterval(intervalId);
	}, []); // Empty dependency array ensures this runs once

	async function fetchPayloads() {
		try {
			if (activeFlowRef.current === null) return;

			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/sessions`,
				{ params: { subscriber_url: subUrl } }
			);
			const data: CacheSessionData = {
				subscriberUrl: subUrl,
				...response.data,
			};

			setCacheData(data);
			setSideView(response.data);
		} catch (e) {
			toast.error("Error while fetching payloads");
			console.error("error while fetching payloads", e);
		}
	}

	function fetchSessionData() {
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
				params: {
					subscriber_url: subUrl,
				},
			})
			.then((response) => {
				const filteredData = Object.entries(response.data)
					.filter(([_, value]) => typeof value === "string")
					.reduce((acc: any, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {});
				delete filteredData["active_session_id"];
				delete filteredData["current_flow_id"];
				setSessionData(filteredData);
				setCacheData(response.data);
			});
	}

	return (
		<div className="w-full min-h-screen flex flex-col">
			<div className="space-y-2 p-4">
				{sessionData ? (
					<InfoCard
						data={{
							...sessionData,
							activeFlow: activeFlow || "N/A",
						}}
					/>
				) : (
					<div>Loading...</div>
				)}
				<div className="flex justify-end">
					<button
						className="bg-sky-500 text-white px-4 py-2 mt-1 rounded hover:bg-sky-600 shadow-md transition-colors"
						onClick={() => setStep((s: number) => s + 1)}
					>
						Generate Report
					</button>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex flex-1 w-full">
				{/* Left Column - Main Content */}
				<div className="w-full sm:w-[60%] overflow-y-auto p-4">
					{flows.domain.map((domain) => (
						<div key={domain.name} className="mb-8">
							{domain.flows.map((flow) => (
								<Accordion
									key={flow.id}
									flow={flow}
									activeFlow={activeFlow}
									setActiveFlow={setActiveFlow}
									cacheData={cacheData}
									setSideView={setSideView}
									subUrl={subUrl}
								/>
							))}
						</div>
					))}
				</div>

				{/* Right Column - Sticky Request & Response */}
				<div className="w-full sm:w-[40%] p-4">
					{/* Sticky Container */}
					<div className="bg-white rounded-md shadow-md border sticky top-20">
						<h2 className="m-1 text-lg font-semibold">Request & Response</h2>
						<div className="p-2">
							{cacheData ? (
								<div
									className="rounded-md overflow-auto"
									style={{ maxHeight: "500px" }} // Adjust maxHeight as needed
								>
									<JsonView
										value={sideView}
										style={githubDarkTheme}
										className="rounded-md"
										displayDataTypes={false}
									/>
								</div>
							) : (
								<Loader />
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Accordion component for each flow

export default RenderFlows;
