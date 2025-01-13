import { FormConfigType } from "../components/ui/forms/config-form/config-form";

export interface CacheSessionData {
	type: string;
	current_session_id: string;
	current_flow_id?: string;
	session_payloads: {
		[key: string]: {
			request: any;
			response: any;
		}[];
	};
}

export interface State {
	type: string;
	key: string;
	description: string;
	stepIndex: number;
	owner: "BAP" | "BPP";
	// state?: "success" | "error" | "pending" | "inactive";
	flowId: string;
	cachedData: CacheSessionData;
	setSideView: React.Dispatch<any>;
	subscriberUrl: string;
	input?: FormConfigType;
}

export interface SequenceCardProps {
	step: State;
	pair?: State;
}
