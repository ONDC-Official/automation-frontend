import { getSessionService } from "../services/sessionService";
import logger from "@ondc/automation-logger";

export const buildMockBaseURL = async (url: string, sessionId: string) => {
	const sessionData = await getSessionService(sessionId);

	let mockUrl = process.env.MOCK_SERVICE as string;
	const usecase = sessionData.usecaseId;
	if (usecase === "PLAYGROUND-FLOW") {
		return `${mockUrl}/playground/${url}`;
	}
	if (mockUrl.includes("localhost")) {
		logger.info("Mock service is running in localhost");
		const newUrl = `${mockUrl}/${sessionData.domain}/${sessionData.version}/${url}`;
		return newUrl;
	}
	const generatedURL = `${mockUrl}/${sessionData.domain}/${url}`;

	logger.info("generated mock url: " + generatedURL);
	return generatedURL;
};
