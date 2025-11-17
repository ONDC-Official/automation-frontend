import { useEffect, useState, useRef } from "react";
import { FlowMap, MappedStep } from "../../../types/flow-state-type";
import FormConfig, {
	FormConfigType,
} from "../../ui/forms/config-form/config-form";
import Popup from "../../ui/pop-up/pop-up";
import { SubmitEventParams } from "../../../types/flow-types";
import { proceedFlow } from "../../../utils/request-utils";
import { useSession } from "../../../context/context";
import { toast } from "react-toastify";
import PairedCard from "./pair-card";

export default function DisplayFlow({
	mappedFlow,
	flowId,
	onFlowProceeded,
}: {
	mappedFlow: FlowMap;
	flowId: string;
	onFlowProceeded?: () => void;
}) {
	// mappedFlow = dummy;
	const steps = getOrderedSteps(mappedFlow);
	const [inputPopUp, setInputPopUp] = useState(false);
	const [activeFormConfig, setActiveFormConfig] = useState<
		FormConfigType | undefined
	>(undefined);
	const hasAutoProceededRef = useRef<boolean>(false);
	const hasForceProceededRef = useRef<boolean>(false);

	const { sessionId, sessionData } = useSession()

	useEffect(() => {
		const conf = mappedFlow?.sequence?.filter(
			(s, index) => s.status === "INPUT-REQUIRED" && index !== 0
		)?.[0]?.input;
		if (conf?.length === 0) {
			handleFormSubmit({ jsonPath: {}, formData: {} });
			return;
		}
		
		// Check if this is a DYNAMIC_FORM that has already been submitted
		const isDynamicForm = conf?.some(field => field.type === "DYNAMIC_FORM");
		const transactionId = sessionData?.flowMap[flowId];
		const formSubmissionData = transactionId ? sessionData?.formSubmissions?.[transactionId] : undefined;
		const isAlreadySubmitted = isDynamicForm && transactionId && formSubmissionData;
		
		console.log('🔍 [mapped-flow] Modal check:', {
			flowId,
			hasInputRequired: !!conf,
			isDynamicForm,
			transactionId,
			formSubmissionData,
			isAlreadySubmitted,
			allFormSubmissions: sessionData?.formSubmissions
		});
		
		// Only show popup if form hasn't been submitted yet
		if (!isAlreadySubmitted) {
			setActiveFormConfig(conf);
			if (conf) {
				console.log('✅ [mapped-flow] Opening form modal');
				setInputPopUp(true);
			}
		} else {
			console.log('⏭️ [mapped-flow] Skipping form popup - already submitted');
			// Ensure modal is closed
			setInputPopUp(false);
			setActiveFormConfig(undefined);
			
			// Form was already submitted - auto-proceed to next step (only once)
			if (!hasAutoProceededRef.current && formSubmissionData && transactionId) {
				hasAutoProceededRef.current = true;
				console.log('🚀 [mapped-flow] Form already submitted, auto-proceeding...');
				handleFormSubmit({
					jsonPath: { submission_id: formSubmissionData.submission_id },
					formData: { submission_id: formSubmissionData.submission_id }
				});
			}
		}
	}, [mappedFlow, sessionData, flowId]);

	useEffect(() => {
		const latestSending = mappedFlow?.sequence.find(
			(f) => f.status === "RESPONDING" || f.status === "LISTENING"
		);
		const transactionId = sessionData?.flowMap[flowId];
		
		// Only force-proceed once to avoid "already in progress" errors
		if (latestSending && latestSending.force_proceed && transactionId && !hasForceProceededRef.current) {
			console.log('🚀 [mapped-flow] Force proceeding due to force_proceed flag', {
				status: latestSending.status,
				actionId: latestSending.actionId,
				owner: latestSending.owner
			});
			hasForceProceededRef.current = true;
			proceedFlow(sessionId, transactionId);
		}
		
		// Reset the flag when no longer in actionable state
		if (!latestSending || (latestSending.status !== "RESPONDING" && latestSending.status !== "LISTENING")) {
			hasForceProceededRef.current = false;
		}
	}, [mappedFlow, sessionData, flowId, sessionId]);

	const handleFormSubmit = async (formData: SubmitEventParams) => {
		try {
			console.log('📨 [mapped-flow] handleFormSubmit called with:', formData);
			const txId = sessionData?.flowMap[flowId];
			console.log('📨 [mapped-flow] Transaction ID:', txId, 'Flow ID:', flowId);
			
			if (!txId) {
				console.error("❌ [mapped-flow] Transaction ID not found");
				return;
			}
			
			console.log('📤 [mapped-flow] Calling proceedFlow with:', {
				sessionId,
				txId,
				jsonPath: formData.jsonPath,
				formData: formData.formData
			});
			
			const result = await proceedFlow(sessionId, txId, formData.jsonPath, formData.formData);
			console.log('✅ [mapped-flow] proceedFlow result:', result);
			
			setInputPopUp(false);
			setActiveFormConfig(undefined);
			console.log('✅ [mapped-flow] Modal closed');
			
			// Refresh the flow state to show the next step
			if (onFlowProceeded) {
				console.log('🔄 [mapped-flow] Calling onFlowProceeded to refresh flow state');
				onFlowProceeded();
			}
			
			// Reset auto-proceed flag after successful proceed
			hasAutoProceededRef.current = false;
		} catch (error) {
			toast.error("Error submitting form ");
			console.error("❌ [mapped-flow] Error submitting form data:", error);
			setInputPopUp(false);
		}
	};
	return (
		<>
			<div>
				{steps.map((pairedStep, index) => (
					<PairedCard key={index} pairedStep={pairedStep} flowId={flowId} />
				))}
			</div>
			<div></div>
		{inputPopUp && activeFormConfig && (
			<Popup isOpen={inputPopUp} onClose={() => setInputPopUp(false)}>
				<FormConfig
					formConfig={activeFormConfig}
					submitEvent={handleFormSubmit}
					referenceData={mappedFlow.reference_data}
					flowId={flowId}
				/>
			</Popup>
		)}
		</>
	);
}

export type PairedStep = {
	first: MappedStep;
	second?: MappedStep;
};

function getOrderedSteps(mappedFlow: FlowMap): PairedStep[] {
	const sequence = [...mappedFlow.sequence, ...mappedFlow.missedSteps];
	const visited = new Set<string>();
	const steps: PairedStep[] = [];

	for (const step of sequence) {
		if (visited.has(`${step.actionId}_${step.index}`)) continue;

		visited.add(`${step.actionId}_${step.index}`);

		let pairStep: MappedStep | undefined;
		if (step.pairActionId) {
			pairStep = sequence.find((s) => s.actionId === step.pairActionId);
			if (pairStep && !visited.has(pairStep.actionId)) {
				visited.add(`${pairStep.actionId}_${pairStep.index}`);
			}
		}

		steps.push({
			first: step,
			second: pairStep,
		});
	}

	return steps.sort((a, b) => {
		return a.first.index - b.first.index;
	});
}
