import { redisService } from "ondc-automation-cache-lib";
import { TransformedSessionData } from "../interfaces/sessionData";

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

	const transformedData: TransformedSessionData = {
		active_session_id: sessionId,
		type: participantType,
		domain,
		version,
		// city,
		// subscriber_id: subscriberId,
		subscriber_url: subscriberUrl,
		// np_id: subscriberId,
		session_payloads: session_payloads,
		context_cache: contextCache,
		difficulty_cache: {
			// sensitiveTTL: false,
			useGateway: false,
			stopAfterFirstNack: false,
			protocolValidations: true,
			timeValidations: false,
			headerValidaton: false,
		},
		current_flow_id: "unit",
	};

	try {
		// Store session data in Redis
		await redisService.setKey(
			subscriberUrl,
			JSON.stringify(transformedData),
			SESSION_EXPIRY
		);
		return "Session created successfully";
	} catch (error: any) {
		throw new Error(`${error.message}`);
	}
};
