// Define your data types
export interface FetchFlowsResponse {
	domain: Domain[];
}

export interface Domain {
	name: string;
	flows: Flow[];
}

export interface Flow {
	id: string;
	description: string;
	sequence: SequenceStep[];
}

export interface SequenceStep {
	key: string;
	type: string;
	unsolicited: boolean;
	description: string;
	pair: string | null;
}
