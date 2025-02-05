import { RedisService } from "ondc-automation-cache-lib";
import { EventEmitter } from 'events';
import logger from '../utils/logger';

interface LogMessage {
    channel: 'SET' | 'DELETE';
    dbIndex: number;
    key: string;
}

interface LogData {
    transactionId: string;
    message: string;
    level: 'info' | 'error' | 'warn';
    timestamp: string;
}

export const logEventEmitter = new EventEmitter();

export const initializeLogSubscriber = async () => {
    try {
        // Subscribe to DB 3 (logs database)
        await RedisService.subscribeToDb(3, async (message: LogMessage) => {
            try {
                logger.info(`Log event received: ${JSON.stringify(message)}`);
                
                if (message.channel === 'SET') {
                    // Fetch the actual log data
                    const logData = await RedisService.getKey(message.key);
                    if (logData) {
                        const parsedLogData: LogData[] = JSON.parse(logData);
                        
                        // Emit the log data for any connected clients
                        logEventEmitter.emit('newLog', {
                            transactionId: message.key,
                            logs: parsedLogData
                        });
                        
                        // Log to console for debugging
                        logger.debug(`New logs for transaction ${message.key}:`, parsedLogData);
                    }
                }
            } catch (error) {
                logger.error('Error processing log message:', error);
            }
        });

        logger.info('Successfully subscribed to logs database (DB 3)');
    } catch (error) {
        logger.error('Failed to initialize log subscriber:', error);
        throw error;
    }
};

// Helper function to subscribe to logs for a specific transaction
export const subscribeToTransactionLogs = (
    transactionId: string,
    callback: (logs: LogData[]) => void
) => {
    const handler = (data: { transactionId: string, logs: LogData[] }) => {
        if (data.transactionId === transactionId) {
            callback(data.logs);
        }
    };

    logEventEmitter.on('newLog', handler);

    // Return cleanup function
    return () => {
        logEventEmitter.off('newLog', handler);
    };
}; 