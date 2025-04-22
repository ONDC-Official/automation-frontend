import { useContext, useEffect, useState } from "react";
import { FlowMap, MappedStep } from "../../../types/flow-state-type";
import FormConfig, {
	FormConfigType,
} from "../../ui/forms/config-form/config-form";
import Popup from "../../ui/pop-up/pop-up";
import { SubmitEventParams } from "../../../types/flow-types";
import { proceedFlow } from "../../../utils/request-utils";
import { SessionContext } from "../../../context/context";
import { toast } from "react-toastify";
import PairedCard from "./pair-card";

const dummy: FlowMap = {
	sequence: [
		{
			status: "COMPLETE",
			actionId: "search_ride",
			owner: "BAP",
			actionType: "search",
			input: [
				{
					name: "city_code",
					label: "Enter city code",
					type: "text",
					payloadField: "$.context.location.city.code",
				},
				{
					name: "start_gps",
					label: "Enter start gps coordinates",
					type: "text",
					payloadField:
						"$.message.intent.fulfillment.stops[?(@.type=='START')].location.gps",
				},
				{
					name: "end_gps",
					label: "Enter end gps coordinates",
					type: "text",
					payloadField:
						"$.message.intent.fulfillment.stops[?(@.type=='END')].location.gps",
				},
			],
			payloads: {
				action: "search",
				messageId: "2fce665a-2987-4b96-8c79-408922a28062",
				timestamp: "2025-04-20T15:53:42.254Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "8edd2ce7-5e94-4234-8489-bafb99372be2",
						response: { message: { ack: { status: "ACK" } } },
					},
					{
						payloadId: "8edd2ce7-5e94-4234-8489-bafb99372be4",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: 0,
			unsolicited: false,
			pairActionId: "on_search",
		},
		{
			status: "COMPLETE",
			actionId: "on_search",
			owner: "BPP",
			actionType: "on_search",
			payloads: {
				action: "on_search",
				messageId: "2fce665a-2987-4b96-8c79-408922a28062",
				timestamp: "2025-04-20T15:53:45.591Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "43cc1771-248f-4fad-b77a-c200bebbdd9d",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: 1,
			unsolicited: false,
			pairActionId: null,
		},
		{
			status: "COMPLETE",
			actionId: "select",
			owner: "BAP",
			actionType: "select",
			payloads: {
				action: "select",
				messageId: "8885a05d-464c-4c72-9c06-672a4a4c321b",
				timestamp: "2025-04-20T15:53:48.093Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "fc5a013c-937a-4764-8c6a-b53130edd68d",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: 2,
			unsolicited: false,
			pairActionId: "on_select",
		},
		{
			status: "COMPLETE",
			actionId: "on_select",
			owner: "BPP",
			actionType: "on_select",
			payloads: {
				action: "on_select",
				messageId: "8885a05d-464c-4c72-9c06-672a4a4c321b",
				timestamp: "2025-04-20T15:53:51.341Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "610e9645-4480-4ec1-bd3f-ea5799cf8b54",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: 3,
			unsolicited: false,
			pairActionId: null,
		},
		{
			status: "COMPLETE",
			actionId: "init",
			owner: "BAP",
			actionType: "init",
			payloads: {
				action: "init",
				messageId: "befa4aa2-abeb-4192-986e-e0df5ea774c9",
				timestamp: "2025-04-20T15:53:54.148Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "3df3d8a9-1f89-41f6-8eb5-623a9c746126",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: 4,
			unsolicited: false,
			pairActionId: "on_init",
		},
		{
			status: "RESPONDING",
			actionId: "on_init",
			owner: "BPP",
			actionType: "on_init",
			payloads: {
				action: "on_init",
				messageId: "befa4aa2-abeb-4192-986e-e0df5ea774c9",
				timestamp: "2025-04-20T15:53:56.657Z",
				subStatus: "ERROR",
				payloads: [
					{
						payloadId: "3d932d2e-92e7-4369-bf02-442cec3b9d6a",
						response: {
							message: { ack: { status: "NACK" } },
							error: {
								code: "30000",
								message:
									"- **condition REQUIRED_message_order_fulfillments_id**: $.message.order.fulfillments[*].id must be present in the payload",
							},
						},
					},
				],
			},
			index: 5,
			unsolicited: false,
			pairActionId: null,
		},
		{
			status: "LISTENING",
			actionId: "confirm",
			owner: "BAP",
			actionType: "confirm",
			index: 6,
			unsolicited: false,
			pairActionId: "on_confirm",
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_confirm",
			owner: "BPP",
			actionType: "on_confirm",
			index: 7,
			unsolicited: false,
			pairActionId: null,
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_status_unsolicited",
			owner: "BPP",
			actionType: "on_status",
			index: 8,
			unsolicited: true,
			pairActionId: null,
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "track_ride",
			owner: "BAP",
			actionType: "track",
			index: 9,
			unsolicited: false,
			pairActionId: "on_track_ride",
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_track_ride",
			owner: "BPP",
			actionType: "on_track",
			index: 10,
			unsolicited: false,
			pairActionId: null,
			expect: false,
		},
		{
			status: "COMPLETE",
			actionId: "on_status_ride_arrived",
			owner: "BPP",
			actionType: "on_status",
			index: 11,
			unsolicited: true,
			pairActionId: null,
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_status_ride_started",
			owner: "BPP",
			actionType: "on_status",
			index: 12,
			unsolicited: true,
			pairActionId: null,
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_update",
			owner: "BPP",
			actionType: "on_update",
			index: 13,
			unsolicited: true,
			pairActionId: null,
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "status",
			owner: "BAP",
			actionType: "status",
			index: 14,
			unsolicited: false,
			pairActionId: "on_status_solicited",
			expect: false,
		},
		{
			status: "WAITING",
			actionId: "on_status_solicited",
			owner: "BPP",
			actionType: "on_status",
			index: 15,
			unsolicited: false,
			pairActionId: null,
			expect: false,
		},
	],
	missedSteps: [
		{
			status: "COMPLETE",
			actionId: "init",
			owner: "BAP",
			actionType: "init",
			payloads: {
				action: "init",
				messageId: "befa4aa2-abeb-4192-986e-e0df5ea774c9",
				timestamp: "2025-04-20T15:53:54.148Z",
				subStatus: "SUCCESS",
				payloads: [
					{
						payloadId: "3df3d8a9-1f89-41f6-8eb5-623a9c746126",
						response: { message: { ack: { status: "ACK" } } },
					},
				],
			},
			index: -1,
			unsolicited: false,
			pairActionId: "",
			missedStep: true,
		},
	],
};

export default function DisplayFlow({
	mappedFlow,
	setSideView,
	flowId,
}: {
	mappedFlow: FlowMap;
	setSideView: React.Dispatch<any>;
	flowId: string;
}) {
	// mappedFlow = dummy;
	const steps = getOrderedSteps(mappedFlow);
	const [inputPopUp, setInputPopUp] = useState(false);
	const [activeFormConfig, setActiveFormConfig] = useState<
		FormConfigType | undefined
	>(undefined);

	const { sessionId, sessionData } = useContext(SessionContext);

	useEffect(() => {
		const conf = mappedFlow?.sequence?.filter(
			(s, index) => s.status === "INPUT-REQUIRED" && index !== 0
		)?.[0]?.input;
		if (conf?.length === 0) {
			handleFormSubmit({ jsonPath: {}, formData: {} });
			return;
		}
		setActiveFormConfig(conf);
		if (conf) {
			setInputPopUp(true);
		}
	}, [mappedFlow]);

	const handleFormSubmit = async (formData: SubmitEventParams) => {
		try {
			const txId = sessionData?.flowMap[flowId];
			if (!txId) {
				console.error("Transaction ID not found");
				return;
			}
			await proceedFlow(sessionId, txId, formData.jsonPath);
			setInputPopUp(false);
			setActiveFormConfig(undefined);
		} catch (error) {
			toast.error("Error submitting form ");
			console.error("Error submitting form data:", error);
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
				<Popup isOpen={inputPopUp}>
					<FormConfig
						formConfig={activeFormConfig}
						submitEvent={handleFormSubmit}
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
		return a.first.index;
		// new Date(a.first.payloads?.timestamp ?? "").getTime() -
		// new Date(b.first.payloads?.timestamp ?? "").getTime()
	});
}
