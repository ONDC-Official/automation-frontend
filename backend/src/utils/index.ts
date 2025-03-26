import { getSessionService } from "../services/sessionService";
import logger from "./logger";

export const buildMockBaseURL = async (url: string, sessionId: string) => {
	const sessionData = await getSessionService(sessionId);

	const generatedURL = `${process.env.MOCK_SERVICE as string}/${
		sessionData.domain
	}/${sessionData.version}/${url}`;

	logger.info("generated mock urk: " + generatedURL);
	return generatedURL;
};
