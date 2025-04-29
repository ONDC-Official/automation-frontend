import { getSessionService } from "../services/sessionService";
import logger from "./logger";

export const buildMockBaseURL = async (url: string, sessionId: string) => {
	const sessionData = await getSessionService(sessionId);

	const mockUrl = process.env.MOCK_SERVICE as string;
	if (mockUrl.includes("localhost")) {
		logger.info("Mock service is running in localhost");
		const newUrl = `${process.env.MOCK_SERVICE as string}/${
			sessionData.domain
		}/${url}`;
		return newUrl;
	}
	const generatedURL = `${process.env.MOCK_SERVICE as string}/${
		sessionData.domain
	}/${sessionData.version}/${url}`;

	logger.info("generated mock url: " + generatedURL);
	return generatedURL;
};
