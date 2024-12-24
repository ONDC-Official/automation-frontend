// src/interfaces/sessionData.ts

type sessionId = string;
type subscriberUrl = string;
type participantType = "BPP" | "BAP";

export interface SessionData {
	city: string;
	createdAt: string; // ISO timestamp
	domain: string;
	flowId?: string;
	participantType: participantType;
	sessionId: sessionId;
	subscriberId: string;
	subscriberUrl: subscriberUrl;
	transactions: Record<string, TransactionDetails>; // Example transactions object
	version: string;
}

export interface TransactionDetails {
	createdAt: string; // ISO timestamp
	data: Record<string, any>; // Additional transaction details
	state: string; // State of the transaction
	transactionMode: string; // Type of transaction (auto/manual)
}

export interface TransformedSessionData {
	active_session_id: sessionId;
	type: participantType;
	domain: string;
	version: string;
	city: string;
	np_id: string;
	subscriber_id: string;
	subscriber_url: subscriberUrl;
	current_flow_id?: string;
	session_payloads: Record<string, any[]>;
	context_cache: Record<string, ContextCache>;
	difficulty_cache: Record<string, boolean>;
}

export interface ContextCache {
	latest_timestamp: string; // ISO timestamp
	latest_action: string;
	message_ids: string[];
}

export type SessionKeyType = sessionId | subscriberUrl;
