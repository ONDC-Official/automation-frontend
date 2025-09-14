import { RedisService } from "ondc-automation-cache-lib";
import { SessionCache } from "../interfaces/newSessionData";

const SESSION_EXPIRY = 15 * 60; // 15 minutes

export const createUnitSessionService = async (
	sessionId: string,
	data: any
) => {
	const {
		// city,
		domain,
		participantType,
		// subscriberId,
		subscriberUrl,
		version,
		usecaseId,
	} = data;

	const session_payloads = {
		unit: [],
	};
	const contextCache = {
		unit: {
			latest_timestamp: new Date().toISOString(),
			latest_action: "",
			message_ids: [],
		},
	};

	const transformedData: SessionCache = {
		transactionIds: [],
		flowMap: {},
		npType: participantType,
		domain,
		version,
		subscriberUrl: subscriberUrl,
		env: "STAGING",
		usecaseId,
		sessionDifficulty: {
			sensitiveTTL: false,
			useGateway: false,
			stopAfterFirstNack: false,
			protocolValidations: true,
			timeValidations: false,
			headerValidaton: false,
			useGzip: false,
		},
		flowConfigs: {},
		activeFlow: null,
		activeStep: 0,
	};

	try {
		// Store session data in Redis
		await RedisService.setKey(
			sessionId,
			JSON.stringify(transformedData),
			SESSION_EXPIRY
		);
		return "Session created successfully";
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};
