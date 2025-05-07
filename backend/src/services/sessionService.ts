import { RedisService } from "ondc-automation-cache-lib";
import { SessionCache, SubscriberCache } from "../interfaces/newSessionData";
// import { fetchConfigService } from "./flowService";
import logger from "../utils/logger";
import { saveLog } from "../utils/console";
import axios from "axios";

const SESSION_EXPIRY = 3600; // 1 hour
const EXPECTATION_EXPIRY = 5 * 60 * 1000; // 5 minutes
export const createSessionService = async (
	sessionId: string,
	data: SessionCache
) => {
	const { npType, domain, version, subscriberUrl, env, usecaseId } = data;

	const flowResponse = await axios.get(
		`${process.env.CONFIG_SERVICE as string}/ui/flow`,
		{
			params: {
				domain: domain,
				version: version,
				usecase: usecaseId,
			},
		}
	);
	const flows = flowResponse.data.data.flows;
	const map: Record<string, any> = {};
	for (const flow of flows) {
		map[flow.id] = flow;
	}
	let finalCache: SessionCache = {
		transactionIds: [],
		flowMap: {},
		npType,
		domain,
		version,
		subscriberUrl,
		env,
		usecaseId: usecaseId,
		sessionDifficulty: {
			sensitiveTTL: true,
			useGateway: false,
			stopAfterFirstNack: true,
			protocolValidations: true,
			timeValidations: true,
			headerValidaton: true,
		},
		flowConfigs: map,
	};

	try {
		await RedisService.setKey(
			sessionId,
			JSON.stringify(finalCache),
			SESSION_EXPIRY
		);
		return "Session created successfully";
	} catch (e) {
		logger.error(e);
		throw new Error("Error creating session");
	}
};

export const getSessionService = async (sessionId: string) => {
	try {
		const sessionData = await RedisService.getKey(sessionId);
		if (!sessionData) {
			throw new Error("Session not found");
		}
		return JSON.parse(sessionData) as SessionCache;
	} catch (e) {
		logger.error(e);
		throw new Error("Error fetching session");
	}
};

export const updateSessionService = async (
	sessionId: string,
	data: Partial<SessionCache>
) => {
	const {
		subscriberId,
		npType,
		domain,
		subscriberUrl,
		env,
		sessionDifficulty,
	} = data;

	try {
		// Retrieve the session data from Redis
		const sessionData = await RedisService.getKey(sessionId);

		if (!sessionData) {
			throw new Error("Session not found");
		}

		const session: SessionCache = JSON.parse(sessionData);

		// Update session data fields
		if (subscriberId) session.subscriberId = subscriberId;
		if (subscriberUrl) session.subscriberUrl = subscriberUrl;
		if (npType) session.npType = npType;
		if (domain) session.domain = domain;
		if (sessionDifficulty) session.sessionDifficulty = sessionDifficulty;
		if (env) session.env = env;

		// Save the updated session data back to Redis
		await RedisService.setKey(
			sessionId,
			JSON.stringify(session),
			SESSION_EXPIRY
		);

		return "Session updated successfully";
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};

export const clearFlowService = async (sessionId: string, flowId: string) => {
	try {
		const sessionData = await RedisService.getKey(sessionId);
		if (!sessionData) {
			throw new Error("Session not found");
		}

		const session: SessionCache = JSON.parse(sessionData);
		logger.debug(JSON.stringify(session));
		const transactionId = session.flowMap[flowId];
		if (transactionId) {
			const index = session.transactionIds.indexOf(transactionId);
			if (index > -1) {
				session.transactionIds.splice(index, 1);
			}
		}
		session.flowMap[flowId] = undefined;
		await RedisService.setKey(
			sessionId,
			JSON.stringify(session),
			SESSION_EXPIRY
		);
	} catch (e) {
		logger.error(e);
		throw new Error("Error clearing flow");
	}
};

export const createExpectationService = async (
	subscriberUrl: string,
	flowId: string,
	sessionId: string,
	expectedAction: string
): Promise<string> => {
	try {
		// Fetch existing session data from Redis
		const sessionData = await RedisService.getKey(subscriberUrl);

		let parsed: SubscriberCache = { activeSessions: [] };

		if (sessionData) {
			const paraseSession = JSON.parse(sessionData);
			if (paraseSession.activeSessions) {
				parsed = JSON.parse(sessionData);
			}
		}

		// Remove expired expectations and check for conflicts
		parsed.activeSessions = parsed.activeSessions.filter((expectation) => {
			const isExpired = new Date(expectation.expireAt) < new Date();

			if (isExpired) return false; // Remove expired session

			if (expectation.sessionId === sessionId) {
				saveLog(
					sessionId,
					`Expectation already exists for sessionId: ${sessionId}`,
					"error"
				);
				throw new Error(
					`Expectation already exists for sessionId: ${sessionId} and flowId: ${flowId}`
				);
			}

			if (expectation.expectedAction === expectedAction) {
				saveLog(
					sessionId,
					`Expectation already exists for action: ${expectedAction}`,
					"error"
				);
				throw new Error(
					`Expectation already exists for the action: ${expectedAction}`
				);
			}

			return true; // Keep valid expectations
		});

		// Add new expectation
		const expireAt = new Date(Date.now() + EXPECTATION_EXPIRY).toISOString();

		const expectation = {
			sessionId,
			flowId,
			expectedAction,
			expireAt,
		};

		parsed.activeSessions.push(expectation);

		saveLog(sessionId, `waiting for action: ${expectedAction}`);
		// Update Redis with the modified session data
		await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
		await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));

		return "Expectation created successfully";
	} catch (error: any) {
		throw new Error(`Failed to create expectation: ${error.message}`);
	}
};

export const deleteExpectationService = async (
	sessionId: string,
	subscriberUrl: string
) => {
	try {
		const subscriberData = await RedisService.getKey(subscriberUrl);
		if (!subscriberData) {
			throw new Error("Session not found");
		}

		const parsed: SubscriberCache = JSON.parse(subscriberData);
		logger.debug("Parsed data" + JSON.stringify(parsed));
		if (parsed.activeSessions === undefined) {
			throw new Error("No active sessions found");
		}
		parsed.activeSessions = parsed.activeSessions.filter(
			(expectation) => expectation.sessionId !== sessionId
		);

		await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
	} catch (e) {
		logger.error(e);
		throw new Error("Error deleting expectation");
	}
};

export const getTransactionDataService = async (
	transaction_id: string,
	subscriber_url: string
) => {
	try {
		const key = `${transaction_id}::${subscriber_url}`;
		logger.info("Fetching transaction data for key: " + key);
		const data = await RedisService.getKey(key);
		if (!data) {
			throw new Error("Transaction data not found");
		}
		return JSON.parse(data);
	} catch (e) {
		logger.error(e);
		throw new Error("Error fetching transaction data");
	}
};

export const requestForFlowPermissionService = async (
	subscriberUrl: string,
	action: string
) => {
	try {
		const subscriberData = await RedisService.getKey(subscriberUrl);
		logger.info("request for flow permission subscriber data:", subscriberData);
		if (!subscriberData) {
			return {
				valid: true,
				message: "Subscriber not found",
			};
		}
		const parsed: SubscriberCache = JSON.parse(subscriberData);
		if (parsed.activeSessions === undefined) {
			return {
				valid: true,
				message: "No active sessions found",
			};
		}
		parsed.activeSessions = parsed.activeSessions.filter((expectation) => {
			const isExpired = new Date(expectation.expireAt) < new Date();
			if (isExpired) return false; // Remove expired session
			return true; // Keep valid expectations
		});
		const actionExists = parsed.activeSessions.some(
			(expectation) => expectation.expectedAction === action
		);
		await RedisService.setKey(subscriberUrl, JSON.stringify(parsed));
		if (actionExists) {
			return {
				valid: false,
				message: `Already expecting action: ${action} for subscriber: ${subscriberUrl}`,
			};
		}
		return {
			valid: true,
			message: `Subscriber: ${subscriberUrl} is ready for action: ${action}`,
		};
	} catch (e) {
		logger.error("Error requesting flow permission", e);
		throw new Error("Error requesting flow permission");
	}
};
