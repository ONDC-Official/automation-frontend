import logger from "./logger";
import { RedisService } from "ondc-automation-cache-lib";
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

		if (await RedisService.keyExists(key)) {
			const existingLogs = await RedisService.getKey(key);
			logs = JSON.parse(existingLogs ?? "[]");
		}

		// Add new log entry
		logs.push(logEntry);

		// Store updated logs
		await RedisService.setKey(key, JSON.stringify(logs));
	} catch (error) {
		logger.error("Error saving log to Redis:", error);
	}
}
