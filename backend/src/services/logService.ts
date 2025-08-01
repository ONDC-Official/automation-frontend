import { RedisService } from "ondc-automation-cache-lib";
import logger from "@ondc/automation-logger";
export const getLogs = async (sessionId: string) => {
	try {
		const key = `consoleLogs:${sessionId}`;
		const logs = await RedisService.getKey(key);
		return JSON.parse(logs ?? "[]");
	} catch (error) {
		logger.error("Error getting logs from Redis:", { sessionId }, error);
		throw error;
	}
};
