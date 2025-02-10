import logger from "./logger";
import { redisService } from "ondc-automation-cache-lib";

export async function saveLog(
	sessionId: string,
	message: string,
	level: "info" | "error" | "debug" = "info"
) {
	try {
		const timestamp = new Date().toISOString();
		const logEntry = {
			timestamp,
			level,
			message,
		};

		// Get existing logs array or create new one
		let logs = [];
		const key = `consoleLogs:${sessionId}`;

		if (await redisService.keyExists(key)) {
			const existingLogs = await redisService.getKey(key);
			logs = JSON.parse(existingLogs ?? "[]");
		}

		// Add new log entry
		logs.push(logEntry);

		// Store updated logs
		await redisService.setKey(key, JSON.stringify(logs));
	} catch (error) {
		logger.error("Error saving log to Redis:", error);
	}
}
