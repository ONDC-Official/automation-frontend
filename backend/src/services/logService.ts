import { RedisService } from "ondc-automation-cache-lib";
import logger from "../utils/logger";

export const getLogs = async (sessionId: string) => {
    try {
        const key = `consoleLogs:${sessionId}`;
        const logs = await RedisService.getKey(key);
        return JSON.parse(logs ?? '[]');
    } catch (error) {
        logger.error('Error getting logs from Redis:', error);
        throw error;
    }
}; 