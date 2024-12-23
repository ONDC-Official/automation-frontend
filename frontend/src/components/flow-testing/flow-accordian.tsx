import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify"; // Assuming you're using react-toastify for notifications
import SequenceCard from "./sequence-card";
import { triggerSearch } from "../../utils/request-utils";
import { Flow, SequenceStep } from "../../types/flow-types";
import { CacheSessionData } from "../../types/session-types";

interface AccordionProps {
	flow: Flow;
	activeFlow: string | null;
	setActiveFlow: (flowId: string | null) => void;
	cacheData?: CacheSessionData | null;
	setSideView: React.Dispatch<any>;
}

export function Accordion({
	flow,
	activeFlow,
	setActiveFlow,
	cacheData,
	setSideView,
}: AccordionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const [maxHeight, setMaxHeight] = useState("0px");

	// Update maxHeight based on isOpen state
	useEffect(() => {
		if (contentRef.current) {
			setMaxHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
		}
	}, [isOpen]);

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
			<div
				// className="flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 cursor-pointer"
				className="flex items-center justify-between px-5 py-3 bg-white border rounded-md shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-controls={`accordion-content-${flow.id}`}
			>
				{/* Header */}
				<h3 className="text-base font-medium">Flow Id: {flow.id}</h3>
				<div className="flex items-center">
					{!activeFlow && (
						<button
							onClick={async (e) => {
								e.stopPropagation(); // Prevent accordion toggle
								await startFlow();
							}}
							className="mr-2 text-sky-600 border border-sky-600 p-1 ml-4 rounded hover:bg-sky-600 hover:text-white transition-colors"
						>
							Start
						</button>
					)}
					{activeFlow === flow.id && (
						<button
							onClick={(e) => {
								e.stopPropagation(); // Prevent accordion toggle
								setActiveFlow(null);
							}}
							className="mr-2 text-red-500 border border-red-500 p-1 ml-4 rounded hover:bg-red-500 hover:text-white transition-colors flex justify-start items-center"
						>
							Stop
						</button>
					)}
					<svg
						className={`w-6 h-6 transform transition-transform duration-200 ${
							isOpen ? "rotate-180" : ""
						}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 15l7-7 7 7"
						/>
					</svg>
				</div>
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
										cachedData: cacheData,
										flowId: flow.id,
										setSideView: setSideView,
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
											setSideView: setSideView,
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
