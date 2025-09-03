import { FormConfigType } from "../components/ui/forms/config-form/config-form";

export type ReducedApiData = {
	entryType: "API";
	action: string;
	messageId: string;
	timestamp: string;
	subStatus: "SUCCESS" | "ERROR";
	payloads: {
		payloadId: string;
		response: any;
	}[];
};

export type ReduceFormData = {
	entryType: "FORM";
	formType: "HTML_FORM" | "RES_FROM";
	formId: string;
	submissionId?: string;
	timestamp: string;
	subStatus?: "SUCCESS" | "ERROR";
};

export type ApiHistory = ReducedApiData | ReduceFormData;

export type ReducedApiList = ReducedApiData[];

export interface FlowMap {
	sequence: MappedStep[];
	missedSteps: MappedStep[];
	reference_data?: Record<string, any>;
}
export interface MappedStep {
	status:
		| "COMPLETE"
		| "LISTENING"
		| "RESPONDING"
		| "WAITING"
		| "INPUT-REQUIRED"
		| "PROCESSING"
		| "WAITING-SUBMISSION";
	actionId: string;
	owner: "BAP" | "BPP";
	actionType: string;
	input?: FormConfigType;
	payloads?: ApiHistory;
	index: number;
	description?: string;
	unsolicited: boolean;
	pairActionId: string | null;
	expect?: boolean;
	missedStep?: boolean;
	label?: string;
	force_proceed?: boolean;
}
