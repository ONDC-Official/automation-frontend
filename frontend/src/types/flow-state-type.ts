import { FormConfigType } from "../components/ui/forms/config-form/config-form";

export interface ReducedApiData {
	action: string;
	messageId: string;
	timestamp: string;
	subStatus: "SUCCESS" | "ERROR";
	payloads: {
		payloadId: string;
		response: any;
	}[];
}

export type ReducedApiList = ReducedApiData[];

export interface FlowMap {
	sequence: MappedStep[];
	missedSteps: MappedStep[];
}
export interface MappedStep {
	status:
		| "COMPLETE"
		| "LISTENING"
		| "RESPONDING"
		| "WAITING"
		| "INPUT-REQUIRED";
	actionId: string;
	owner: "BAP" | "BPP";
	actionType: string;
	input?: FormConfigType;
	payloads?: ReducedApiData;
	index: number;
	description?: string;
	unsolicited: boolean;
	pairActionId: string | null;
	expect?: boolean;
	missedStep?: boolean;
}
