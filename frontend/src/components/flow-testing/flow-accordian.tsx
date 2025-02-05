import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import SequenceCard from "./SequenceCard";
import { Flow, SequenceStep } from "../../types/flow-types";
import { SessionCache, TransactionCache } from "../../types/session-types";
import IconButton from "../ui/mini-components/icon-button";
import { FaRegStopCircle } from "react-icons/fa";
import { IoPlay } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import {
	clearFlowData,
	deleteExpectation,
	getCompletePayload,
	getTransactionData,
	requestForFlowPermission,
} from "../../utils/request-utils";
import { IoMdDownload } from "react-icons/io";

interface AccordionProps {
	flow: Flow;
	activeFlow: string | null;
	setActiveFlow: (flowId: string | null) => void;
	sessionCache?: SessionCache | null;
	sessionId: string;
	setSideView: React.Dispatch<any>;
	subUrl: string;
	onFlowStop: () => void;
	onFlowClear: () => void;
}

export function Accordion({
	flow,
	activeFlow,
	setActiveFlow,
	sessionCache,
	sessionId,
	setSideView,
	subUrl,
	onFlowStop,
	onFlowClear,
}: AccordionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [transactionCache, setTransactionCache] = useState<
		TransactionCache | undefined
	>(undefined);
	const contentRef = useRef<HTMLDivElement>(null);
	const [maxHeight, setMaxHeight] = useState("0px");

	useEffect(() => {
		const fetchTransactionData = async () => {
			if (sessionCache && activeFlow === flow.id) {
				const tx = sessionCache.flowMap[flow.id];
				if (tx) {
					try {
						const txData = await getTransactionData(tx, subUrl);
						setTransactionCache(txData);
					} catch (error) {
						console.error("Failed to fetch transaction data:", error);
					}
				}
			}
		};
		fetchTransactionData();
	}, [sessionCache, flow.id, subUrl]);

	useEffect(() => {
		if (contentRef.current) {
			setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
		}
	}, [isOpen]);

	const steps = getOrderedSteps(flow.sequence);

	const startFlow = async () => {
		try {
			console.log(sessionCache);
			if (!sessionCache) return;
			const canStart = await canStartFlow(sessionCache, flow, transactionCache);
			console.log(canStart);
			if (!canStart) return;
			setActiveFlow(flow.id);
			setIsOpen(true);
		} catch (e) {
			toast.error("Error while starting flow");
			console.error(e);
		}
	};

	let stepIndex = 0;
	if (!sessionCache) return <div>Loading...</div>;

	const handleDownload = async () => {
		const payload_ids = transactionCache?.apiList.map(
			(payload) => payload?.payloadId
		);

		if (!payload_ids) {
			return;
		}

		const jsonData = await getCompletePayload(payload_ids);
		const jsonString = JSON.stringify(jsonData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });

		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${flow?.id}-${activeFlow}`;
		document.body.appendChild(a);

		a.click();
		URL.revokeObjectURL(url);
		document.body.removeChild(a);
	};

	function AccordionButtons() {
		return (
			<div className="flex items-center">
				{!activeFlow && (
					<IconButton
						icon={<IoPlay className=" text-md" />}
						label="Start flow"
						color="sky"
						onClick={async (e) => {
							e.stopPropagation();
							await startFlow();
						}}
					/>
				)}
				{activeFlow === flow.id && (
					<IconButton
						icon={<FaRegStopCircle className=" text-xl" />}
						label="Stop flow"
						color="red"
						onClick={async (e) => {
							e.stopPropagation(); // Prevent accordion toggle
							setActiveFlow(null);
							setIsOpen(false);
							await deleteExpectation(sessionId, subUrl);
							onFlowStop();
						}}
					/>
				)}
				{!activeFlow && (
					<IconButton
						icon={<AiOutlineDelete className=" text-md" />}
						label="Clear flow data"
						color="orange"
						onClick={async (e) => {
							e.stopPropagation();
							setTransactionCache(undefined);
							await clearFlowData(sessionId, flow.id);
							onFlowClear();
						}}
					/>
				)}
				{transactionCache?.apiList && transactionCache?.apiList?.length > 0 && (
					<IconButton
						icon={<IoMdDownload className=" text-md" />}
						label="Download Logs"
						color="green"
						onClick={async (e) => {
							e.stopPropagation();
							handleDownload();
						}}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="rounded-md border border-zinc-300 mb-4 shadow-lg w-full ml-1">
			<div
				className="flex items-center justify-between px-5 py-3 bg-white border rounded-md shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-controls={`accordion-content-${flow.id}`}
			>
				<h3 className="text-base font-bold text-sky-700">
					<pre>Flow Id:</pre>{" "}
					<h2 className="text-black font-medium">{flow.id}</h2>
				</h3>
				<AccordionButtons />
			</div>

			{/* Accordion content with drop animation */}
			<div
				ref={contentRef}
				id={`accordion-content-${flow.id}`}
				className="overflow-hidden transition-all duration-300 ease-in-out"
				style={{ maxHeight: `${maxHeight}` }}
			>
				<div className="px-4 py-5 bg-white">
					<p className="text-gray-700 mb-6">{flow.description}</p>

					<div className="space-y-4 relative">
						{steps.map((stepPair, index) => {
							stepIndex += 2;
							const pairData = stepPair.pair
								? {
										...stepPair.pair,
										stepIndex: stepIndex,
										transactionData: transactionCache,
										sessionData: sessionCache,
										flowId: flow.id,
										sessionId: sessionId,
										setSideView: setSideView,
										subscriberUrl: subUrl,
										activeFlowId: activeFlow || "",
								  }
								: undefined;
							return (
								<div key={index}>
									<SequenceCard
										step={{
											...stepPair.step,
											stepIndex: stepIndex - 1,
											transactionData: transactionCache,
											sessionData: sessionCache,
											flowId: flow.id,
											sessionId: sessionId,
											setSideView: setSideView,
											subscriberUrl: subUrl,
											activeFlowId: activeFlow || "",
										}}
										pair={pairData}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

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

async function canStartFlow(
	sessionData: SessionCache,
	flow: Flow,
	transactionCache?: TransactionCache
) {
	if (transactionCache) return true;
	const action = flow.sequence[0].type;
	if (flow.sequence[0].expect && sessionData.npType === "BAP") {
		console.log("Requesting for flow permission");
		return await requestForFlowPermission(action, sessionData.subscriberUrl);
	}
	return true;
}
