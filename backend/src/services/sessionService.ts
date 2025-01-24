import { redisService } from "ondc-automation-cache-lib";
import { ContextCache, SessionData } from "../interfaces/sessionData";
import {
	TransformedSessionData,
	SessionKeyType,
} from "../interfaces/sessionData";
import { fetchConfigService } from "./flowService";

const SESSION_EXPIRY = 3600; // 1 hour

export const createSessionService = async (
	sessionId: string,
	data: SessionData
) => {
	const {
		city,
		domain,
		participantType,
		subscriberId,
		subscriberUrl,
		version,
		difficulty_cache,
	} = data;

	const flowConfig = fetchConfigService();

	const domainFlow = flowConfig.domain.find((s) => s.name === domain);
	const keys = domainFlow?.flows.map((f) => f.id);
	if (!keys) {
		throw new Error("Invalid domain");
	}
	let session_payloads: Record<string, any[]> = {};
	let contextCache: Record<string, ContextCache> = {};
	keys.forEach((key) => {
		session_payloads[key] = [];
		contextCache[key] = {
			latest_timestamp: new Date().toISOString(),
			latest_action: "",
			message_ids: [],
		};
	});
	const transformedData: TransformedSessionData = {
		active_session_id: sessionId,
		type: participantType,
		domain,
		version,
		city,
		subscriber_id: subscriberId,
		subscriber_url: subscriberUrl,
		np_id: subscriberId,
		session_payloads: session_payloads,
		context_cache: contextCache,
		difficulty_cache: {
			// sensitiveTTL: true,
			useGateway: true,
			stopAfterFirstNack: true,
			protocolValidations: true,
			timeValidations: true,
			headerValidaton: true,
		},
	};

	try {
		// Store session data in Redis
		await redisService.setKey(
			subscriberUrl,
			JSON.stringify(transformedData),
			SESSION_EXPIRY
		);
		// await redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', 3600);
		return "Session created successfully";
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};

export const getSessionService = async (sessionKey: SessionKeyType) => {
	try {
		const sessionData = await redisService.getKey(sessionKey);
		if (!sessionData) {
			throw new Error("Session not found");
		}
		// Return the session data if found
		return JSON.parse(sessionData);
	} catch (error: any) {
		// Return a 500 error in case of any issues
		throw new Error(`${error.message}`);
	}
};

// Update session data
export const updateSessionService = async (
	subscriber_url: string,
	data: any
) => {
	const {
		subscriberId,
		participantType,
		domain,
		transactionId,
		transactionMode,
		state,
		details,
		flowId,
		subscriberUrl,
		difficulty,
	} = data;

	try {
		// Retrieve the session data from Redis
		const sessionData = await redisService.getKey(subscriber_url);

		if (!sessionData) {
			throw new Error("Session not found");
		}

		const session: TransformedSessionData = JSON.parse(sessionData);

		// Update session data fields
		if (subscriberId) session.subscriber_id = subscriberId;
		if (subscriberUrl) session.subscriber_url = subscriberUrl;
		if (participantType) session.type = participantType;
		if (domain) session.domain = domain;
		if (flowId) session.current_flow_id = flowId;
		if (difficulty) session.difficulty_cache = difficulty;

		// If transaction data is provided, update the transaction details
		// if (transactionId && transactionMode && state) {
		//     session.transactions[transactionId] = {
		//         transactionMode,
		//         state,
		//         data: details || {},
		//         createdAt: new Date().toISOString(),
		//     };
		// }

		// Save the updated session data back to Redis
		await redisService.setKey(
			subscriber_url,
			JSON.stringify(session),
			SESSION_EXPIRY
		);

		return "Session updated successfully";
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};

export const clearFlowService = async (
	subscriber_url: string,
	flowId: string
) => {
	try {
		const sessionData = await redisService.getKey(subscriber_url);
		if (!sessionData) {
			throw new Error("Session not found");
		}

		const session: TransformedSessionData = JSON.parse(sessionData);
		delete session.current_flow_id
		session.session_payloads[flowId] = [];
		session.context_cache[flowId] = {
			latest_timestamp: new Date().toISOString(),
			latest_action: "",
			message_ids: [],
		};
		await redisService.setKey(
			subscriber_url,
			JSON.stringify(session),
			SESSION_EXPIRY
		);
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};
