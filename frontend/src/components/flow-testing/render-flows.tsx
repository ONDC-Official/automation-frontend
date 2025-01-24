import React, { useEffect, useRef, useState } from "react";
import { FetchFlowsResponse } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import DifficultyCards from "../ui/difficulty-cards";
import axios from "axios";
import { toast } from "react-toastify";
import { CacheSessionData } from "../../types/session-types";
import { putCacheData, getCompletePayload } from "../../utils/request-utils";
import { Accordion } from "./flow-accordian";
import Loader from "../ui/mini-components/loader";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import Tabs from "../ui/mini-components/tabs";

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
	setReport
}: {
	flows: FetchFlowsResponse;
	subUrl: string;
	setStep: React.Dispatch<React.SetStateAction<number>>;
	setReport: React.Dispatch<React.SetStateAction<string>>;
}) {
	const [sessionData, setSessionData] = useState<SessionData | null>(null);
	const [activeFlow, setActiveFlow] = useState<string | null>(null);
	const activeFlowRef = useRef<string | null>(activeFlow);
	const [cacheData, setCacheData] = useState<CacheSessionData | null>(null);
	const [sideView, setSideView] = useState<any>({});
	const [difficultyCache, setDifficultyCache] = useState<any>({});
	const [isFlowStopped, setIsFlowStoppped] = useState<boolean>(false)
	const [selectedTab, setSelectedTab] = useState("Request")
	const [requestData, setRequestData] = useState({})
	const [responseData, setResponseData] = useState({})
	useEffect(() => {
		fetchSessionData();
	}, [subUrl]);

	useEffect(() => {
    if (sideView?.payload_id) {
      getCompletePayload(sideView.payload_id).then((data: any) => {
        setRequestData(data);
      }).catch((e: any) => {
		console.log("Errro while fetching payload: ", e)
		console.log(">>>", sideView)
		setRequestData(sideView.request || {}) 
	  });
      setResponseData(sideView?.response || {});
    } else {
      console.log("sideView", sideView);
      setRequestData(sideView || {});
      setResponseData(sideView || {});
    }
  }, [sideView]);

	console.log("Side view'", sideView, requestData, responseData);

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
			.then((response: any) => {
				const filteredData = Object.entries(response.data)
					.filter(([_, value]) => typeof value === "string")
					.reduce((acc: any, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {});
				delete filteredData["active_session_id"];
				// delete filteredData["current_flow_id"];
				setDifficultyCache(response.data.difficulty_cache);
				setSessionData(filteredData);
				setCacheData(response.data);
			});
	}

	function generateReport() {
		let body: any = {};
		console.log("cachedData", cacheData)
	
		Object.entries(cacheData?.session_payloads || {}).map((data) => {
		  const [key, value]: any = data;
		  if (value.length) {
			body[key] = value.map((val: any) => val.payload_id);
		  }
		});
	
		axios
		  .post(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, body, {
			params: {
			  sessionId: cacheData?.active_session_id,
			},
		  })
		  .then((response) => {
			setReport(response.data.data);
			setStep((s: number) => s + 1)
		  })
		  .catch((e) => {
			console.error(e);
			toast.error("Error while generating report");
		  });
	}

	const handleClearFlow = () => {
		setRequestData({})
		setResponseData({})
		fetchSessionData()
	}
	

	return (
		<div className="w-full min-h-screen flex flex-col">
			<div className="space-y-2 pt-4 pr-4 pl-4">
				{sessionData ? (
					<div className="flex gap-2 flex-col">
						<InfoCard
							title="Flow Challenges"
							data={{
								...sessionData,
								activeFlow: activeFlow || "N/A",
							}}
						/>
						<DifficultyCards
							difficulty_cache={difficultyCache}
							subUrl={subUrl}
						/>
					</div>
				) : (
					<div>Loading...</div>
				)}
				<div className="flex justify-end">
					<button
						className="bg-sky-500 text-white px-4 py-2 mt-1 rounded hover:bg-sky-600 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => generateReport()}
						disabled={!isFlowStopped}
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
									onFlowStop={() => setIsFlowStoppped(true)}
									onFlowClear={() => handleClearFlow()}
								/>
							))}
						</div>
					))}
				</div>

				{/* Right Column - Sticky Request & Response */}
				<div className="w-full sm:w-[40%] p-4">
					{/* Sticky Container */}
					<div className="bg-white rounded-md shadow-md border sticky top-20">
						{/* <h2 className="m-1 text-lg font-semibold">Request & Response</h2> */}
						<Tabs
							className="mt-4 ml-2"
							option1="Request"
							option2="Response"
							onSelectOption={(value: string) =>{
								setSelectedTab(value)
							}
							}
						/>
						<div className="p-2">
							{cacheData ? (
								<div
									className="rounded-md overflow-auto"
									style={{ maxHeight: "500px" }} // Adjust maxHeight as needed
								>
									<JsonView
										value={selectedTab === "Request" ? requestData : responseData}
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
