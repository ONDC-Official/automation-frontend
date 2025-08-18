import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flow } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import DifficultyCards from "../ui/difficulty-cards";
import axios from "axios";
import { toast } from "react-toastify";
import { ApiData, SessionCache } from "../../types/session-types";
import {
	getCompletePayload,
	getTransactionData,
} from "../../utils/request-utils";
import { Accordion } from "./flow-state-viewer/complete-flow";

import Loader from "../ui/mini-components/loader";
import JsonView from "@uiw/react-json-view";
import { githubDarkTheme } from "@uiw/react-json-view/githubDark";
import Tabs from "../ui/mini-components/tabs";
import Console from "../console";
import { ILogs } from "../../interface";
import { SessionContext } from "../../context/context";
import CircularProgress from "../ui/circular-cooldown";
import Modal from "../modal";
import { HiOutlineDocumentReport } from "react-icons/hi";

function RenderFlows({
	flows,
	subUrl,
	sessionId,
	setStep,
	setReport,
}: {
	flows: Flow[];
	subUrl: string;
	sessionId: string;
	setStep: React.Dispatch<React.SetStateAction<number>>;
	setReport: React.Dispatch<React.SetStateAction<string>>;
}) {
	const [activeFlow, setActiveFlow] = useState<string | null>(null);
	const activeFlowRef = useRef<string | null>(activeFlow);
	const [cacheSessionData, setCacheSessionData] = useState<SessionCache | null>(
		null
	);
	const [sideView, _] = useState<any>({});
	const [difficultyCache, setDifficultyCache] = useState<any>({});
	const [isFlowStopped, setIsFlowStopped] = useState<boolean>(false);
	const [selectedTab, setSelectedTab] = useState<"Request" | "Response">(
		"Request"
	);
	const [requestData, setRequestData] = useState({});
	const [responseData, setResponseData] = useState({});
	const [logs, setLogs] = useState<ILogs[]>([]);
	const apiCallFailCount = useRef(0);
	const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		fetchSessionData();
	}, [subUrl]);

	useEffect(() => {
		if (sideView?.payloadId) {
			getCompletePayload([sideView.payloadId])
				.then((data: any) => {
					setRequestData(data[0].req);
				})
				.catch((e: any) => {
					console.log("Errro while fetching payload: ", e);
					console.log(">>>", sideView);
					setRequestData(sideView.request || {});
				});
			setResponseData(sideView?.response || {});
		} else {
			// console.log("sideView", sideView);
			setRequestData(sideView || {});
			setResponseData(sideView || {});
		}
	}, [sideView]);

	console.log("Side view'", sideView, requestData, responseData);

	// Update the ref whenever activeFlow changes
	useEffect(() => {
		activeFlowRef.current = activeFlow;
	}, [activeFlow]);

	// async function fetchPayloads() {
	// 	try {
	// 		if (activeFlowRef.current === null) return;

	// 		const response = await axios.get(
	// 			`${import.meta.env.VITE_BACKEND_URL}/sessions`,
	// 			{ params: { session_id: sessionId } }
	// 		);
	// 		const data: SessionCache = {
	// 			subscriberUrl: subUrl,
	// 			...response.data,
	// 		};
	// 		setCacheSessionData(data);
	// 	} catch (e) {
	// 		toast.error("Error while fetching payloads");
	// 		console.error("error while fetching payloads", e);
	// 	}
	// }

	function fetchSessionData() {
		axios
			.get(`${import.meta.env.VITE_BACKEND_URL}/sessions`, {
				params: {
					session_id: sessionId,
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
				setDifficultyCache(response.data.sessionDifficulty);
				setCacheSessionData(response.data);
				apiCallFailCount.current = 0; // Reset fail count on successful fetch
			})
			.catch((e: any) => {
				console.error("Error while fetching session: ", e);
				apiCallFailCount.current = apiCallFailCount.current + 1;
			});
	}

	async function generateReport() {
		const body: any = {};
		console.log("cachedData", cacheSessionData);
		if (!cacheSessionData) {
			toast.error("Error while generating report");
			return;
		}
		let apiList: ApiData[] | undefined = undefined;

		for (const flow in cacheSessionData.flowMap) {
			const transactionId = cacheSessionData.flowMap[flow];
			if (!transactionId) continue;
			const transData = await getTransactionData(transactionId, subUrl);
			if (!transData) continue;
			apiList = transData.apiList;

			body[flow] = (apiList || []).map((data) => {
				return data.payloadId;
			});
		}

		axios
			.post(`${import.meta.env.VITE_BACKEND_URL}/flow/report`, body, {
				params: {
					sessionId: sessionId,
				},
			})
			.then((response) => {
				setReport(response.data.data);
				setStep((s: number) => s + 1);
			})
			.catch((e) => {
				console.error(e);
				toast.error("Error while generating report");
			});
	}

	const handleClearFlow = () => {
		setRequestData({});
		setResponseData({});
		fetchSessionData();
	};

	return (
		<SessionContext.Provider
			value={{
				sessionId,
				activeFlowId: activeFlow,
				sessionData: cacheSessionData,
				selectedTab: selectedTab,
				setRequestData: setRequestData,
				setResponseData: setResponseData,
			}}
		>
			<Modal
				isOpen={isErrorModalOpen}
				onClose={() => {
					navigate("/home");
					setIsErrorModalOpen(false);
				}}
			>
				<h1 className="text-lg font-semibold text-gray-800">Alert</h1>
				<p className="text-sm text-gray-600">Sesson has expired.</p>
				<p className="text-sm text-gray-600">Check support to raise a query.</p>
			</Modal>
			<div className="w-full min-h-screen flex flex-col">
				<div className="space-y-2 pt-4 pr-4 pl-4">
					{cacheSessionData ? (
						<div className="flex gap-2 flex-col">
							<InfoCard
								title="Info"
								data={{
									sessionId: sessionId,
									subscriberUrl: subUrl,
									activeFlow: activeFlow || "N/A",
									subscriberType: cacheSessionData.npType,
									domain: cacheSessionData.domain,
									version: cacheSessionData.version,
									env: cacheSessionData.env,
									use_case: cacheSessionData.usecaseId,
								}}
								children={
									<div className="w-full flex justify-between">
										<CircularProgress
											duration={5}
											id="flow-cool-down"
											loop={true}
											onComplete={async () => {
												if (apiCallFailCount.current < 5) {
													fetchSessionData();
												} else if (
													apiCallFailCount.current >= 5 &&
													!isErrorModalOpen
												) {
													setIsErrorModalOpen(true);
													console.log("not calling the api");
												}
											}}
											// invisible={true}
											sqSize={16}
											strokeWidth={2}
										/>
										<div className="flex justify-end">
											<button
												className="bg-sky-600 text-white text-sm flex px-2 py-2 rounded hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												onClick={async () => await generateReport()}
												disabled={!isFlowStopped}
											>
												<HiOutlineDocumentReport className="text-lg m2-1" />
												Generate Report
											</button>
										</div>
									</div>
								}
							/>
							<DifficultyCards
								difficulty_cache={difficultyCache}
								sessionId={sessionId}
							/>
						</div>
					) : (
						<div>Loading...</div>
					)}
				</div>

				{/* Main Content Area */}
				<div className="flex flex-1 w-full">
					{/* Left Column - Main Content */}
					<div className="w-full sm:w-[60%] overflow-y-auto p-4">
						{/* {flows.domain.map((domain) => ( */}
						<div className="mb-8 bg-gray-100 p-4 rounded-md border">
							{flows.map((flow) => (
								<Accordion
									key={flow.id}
									flow={flow}
									activeFlow={activeFlow}
									sessionId={sessionId}
									setActiveFlow={setActiveFlow}
									sessionCache={cacheSessionData}
									// setSideView={setSideView}
									subUrl={subUrl}
									onFlowStop={() => setIsFlowStopped(true)}
									onFlowClear={() => handleClearFlow()}
								/>
							))}
						</div>
						{/* ))} */}
					</div>

					{/* Right Column - Sticky Request & Response */}
					<div className="w-full sm:w-[40%] p-4">
						{/* Sticky Container */}
						<div className=" bg-gray-100 rounded-md shadow-md border sticky top-20">
							{/* <h2 className="m-1 text-lg font-semibold">Request & Response</h2> */}
							<Tabs
								className="mt-4 ml-2"
								option1="Request"
								option2="Response"
								onSelectOption={(value: string) => {
									setSelectedTab(value as "Request" | "Response");
								}}
							/>
							<div className="p-2">
								{cacheSessionData ? (
									<div
										className="rounded-md overflow-auto"
										style={{ maxHeight: "500px" }} // Adjust maxHeight as needed
									>
										<JsonView
											value={
												selectedTab === "Request" ? requestData : responseData
											}
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
				<Console logs={logs} setLogs={setLogs} sessionId={sessionId} />
			</div>
		</SessionContext.Provider>
	);
}

// Accordion component for each flow

export default RenderFlows;
