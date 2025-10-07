type Owner = "BAP" | "BPP";

interface Meta {
	domain: string;
	version: string;
}

interface TransactionData {
	transaction_id: string;
	latest_timestamp: string;
	bap_id: string;
	bap_uri: string;
	bpp_id: string;
	bpp_uri: string;
}

interface MockConfig {
	generate: string;
	validate: string;
	requirements: string;
	defaultPayload: string;
	saveData: Record<string, string>;
	inputs: string;
}

export interface PlaygroundActionStep {
	api: string;
	action_id: string;
	owner: Owner;
	responseFor: string | null;
	unsolicited: boolean;
	description: string;
	mock: MockConfig;
}

interface TransactionHistoryItem {
	action_id: string;
	payload: Record<string, any>;
	saved_info: Record<string, any>;
}

export interface MockPlaygroundConfigType {
	meta: Meta;
	transaction_data: TransactionData;
	contextFunc: string;
	steps: PlaygroundActionStep[];
	transaction_history: TransactionHistoryItem[];
}
