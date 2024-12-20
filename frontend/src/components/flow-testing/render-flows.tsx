import { useEffect, useRef, useState } from "react";
import { FetchFlowsResponse, Flow, SequenceStep } from "../../types/flow-types";
import InfoCard from "../ui/info-card";
import SequenceCard from "./sequence-card";
import axios from "axios";
import { toast } from "react-toastify";
import { CacheSessionData } from "../../types/session-types";
import { putCacheData, triggerSearch } from "../../utils/request-utils";

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
	setStep: any;
}) {
	const [sessionData, setSessionData] = useState<SessionData | null>(null);
	const [activeFlow, setActiveFlow] = useState<string | null>(null);
	const activeFlowRef = useRef<string | null>(activeFlow);
	const [cacheData, setCacheData] = useState<CacheSessionData | null>(null);
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
					.filter(([key, value]) => typeof value === "string")
					.reduce((acc: any, [key, value]) => {
						acc[key] = value;
						return acc;
					}, {});
				delete filteredData["active_session_id"];
				setSessionData(filteredData);
				setCacheData(response.data);
				console.log("sessionData", filteredData);
			});
	}

	return (
		<div className=" w-full">
			{sessionData ? (
				<InfoCard
					data={{
						...sessionData,
						SubscriberUrl: subUrl,
						acitveFlow: activeFlow || "N/A",
					}}
				/>
			) : (
				<div>Loading...</div>
			)}
			<button
				className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
				onClick={() => setStep((s: any) => s + 1)}
			>
				End Session
			</button>
			<div className="flex flex-wrap w-full">
				<div className="mt-2 w-[50%]">
					{flows.domain.map((domain) => (
						<div key={domain.name} className="mb-8">
							{domain.flows.map((flow) => (
								<Accordion
									key={flow.id}
									flow={flow}
									activeFlow={activeFlow}
									setActiveFlow={setActiveFlow}
									cacheData={cacheData}
								/>
							))}
						</div>
					))}
				</div>
				<div className="w-full sm:w-[50%] break-words bg-black h-screen overflow-auto">
					<pre className=" text-white">
						{JSON.stringify(cacheData, null, 2)}
					</pre>
				</div>
			</div>
		</div>
	);
}

// Accordion component for each flow
interface AccordionProps {
	flow: Flow;
	activeFlow: string | null;
	setActiveFlow: (flowId: string | null) => void;
	cacheData?: CacheSessionData | null;
}

function Accordion({
	flow,
	activeFlow,
	setActiveFlow,
	cacheData,
}: AccordionProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Process the sequence to align steps with their pairs
	const steps = getOrderedSteps(flow.sequence);

	const startFlow = async () => {
		setActiveFlow(flow.id);
		if (!cacheData) return;
		if (!cacheData.session_payloads[flow.id]) return;
		try {
			if (cacheData.session_payloads[flow.id].length === 0) {
				await triggerSearch(cacheData);
			}
		} catch (e) {
			toast.error("Error while starting flow");
			console.error(e);
		}
	};
	let stepIndex = 0;
	if (!cacheData) return <div>Loading...</div>;
	return (
		<div className="rounded-md border border-zinc-300 mb-4 shadow-lg w-full ml-1">
			{/* Flex container for header and Run button */}
			<div className="flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200">
				{/* Header button */}
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center justify-between flex-1"
				>
					<h3 className="text-base font-medium">Flow Id: {flow.id}</h3>
					<div className="flex">
						{!activeFlow && (
							<button
								onClick={async () => await startFlow()}
								className=" mr-2 text-sky-600 border border-sky-600 p-1 ml-4 rounded hover:bg-sky-600 hover:text-white transition-colors"
							>
								start
							</button>
						)}
						{
							// If the flow is active, show a "Stop" button instead
							activeFlow === flow.id && (
								<>
									<button
										onClick={() => setActiveFlow(null)}
										className="mr-2 text-red-500 border border-red-500 p-1 ml-4 rounded hover:bg-red-500 hover:text-white transition-colors flex justify-start items-center"
									>
										stop
									</button>
								</>
							)
						}
						<svg
							className={`w-6 h-6 transform transition-transform duration-200 ${
								isOpen ? "rotate-180" : ""
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 15l7-7 7 7"
							/>
						</svg>
					</div>
				</button>
			</div>

			{/* Accordion content */}
			{isOpen && (
				<div className="px-4 py-5 bg-white">
					<p className="text-gray-700 mb-6">{flow.description}</p>
					<div className="space-y-4 relative">
						{steps.map((stepPair, index) => {
							stepIndex += 2;
							const pairData = stepPair.pair
								? {
										...stepPair.pair,
										stepIndex: stepIndex,
										cachedData: cacheData,
										flowId: flow.id,
								  }
								: undefined;
							return (
								<div key={index}>
									<SequenceCard
										step={{
											...stepPair.step,
											stepIndex: stepIndex - 1,
											cachedData: cacheData,
											flowId: flow.id,
										}}
										pair={pairData}
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

// Component for each sequence step (with optional pair)

// Helper function to order steps and align pairs
function getOrderedSteps(sequence: SequenceStep[]): {
	step: SequenceStep;
	pair?: SequenceStep;
}[] {
	const visited = new Set<string>();
	const steps = [];

	for (const step of sequence) {
		if (visited.has(step.key)) continue;

		visited.add(step.key);

		let pairStep: SequenceStep | undefined;
		if (step.pair) {
			pairStep = sequence.find((s) => s.key === step.pair);
			if (pairStep && !visited.has(pairStep.key)) {
				visited.add(pairStep.key);
			}
		}

		steps.push({
			step,
			pair: pairStep,
		});
	}

	return steps;
}

export default RenderFlows;
