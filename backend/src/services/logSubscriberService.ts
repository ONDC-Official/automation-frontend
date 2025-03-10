
//====================================================================================
//<--------------------------------KEPT FOR FUTURE USE-------------------------------->
//====================================================================================

// import { RedisService } from "ondc-automation-cache-lib";
// import { EventEmitter } from 'events';
// import logger from '../utils/logger';

// interface LogMessage {
//     channel: 'SET' | 'DELETE';
//     dbIndex: number;
//     key: string;
// }

// interface LogData {
//     transactionId: string;
//     message: string;
//     level: 'info' | 'error' | 'warn';
//     timestamp: string;
// }

// export const logEventEmitter = new EventEmitter();

// export const initializeLogSubscriber = async () => {
//     try {
//         // Subscribe to DB 0 (logs database)
//         // await RedisService.subscribeToDb(0, async (message: LogMessage) => {
//         //     try {
//         //         logger.info(`Log event received: ${JSON.stringify(message)}`);
                
//         //         if (message.channel === 'SET') {
//         //             // Fetch the actual log data
//         //             const logData = await RedisService.getKey(message.key);
//         //             if (logData) {
//         //                 const parsedLogData: LogData[] = JSON.parse(logData);
                        
//         //                 // Emit the log data for any connected clients
//         //                 logEventEmitter.emit('newLog', {
//         //                     transactionId: message.key,
//         //                     logs: parsedLogData
//         //                 });
                        
//         //                 // Log to console for debugging
//         //                 logger.debug(`New logs for transaction ${message.key}:`, parsedLogData);
//         //             }
//         //         }
//         //     } catch (error) {
//         //         logger.error('Error processing log message:', error);
//         //     }
//         // });

//         // logger.info('Successfully subscribed to logs database (DB 0)');

//         // Subscribe to console logs channel
//         await RedisService.subscribeToDb(0, async (message: LogMessage) => {
//             try {
//                 logger.info(`Console log event received: ${JSON.stringify(message)}`);

//                 if (message.channel === 'SET') {
//                     if (message.key.startsWith('consoleLogs:')) {
//                         // Fetch the actual log data
//                         const logData = await RedisService.getKey(message.key);
//                         if (logData) {
//                             const parsedLogData = JSON.parse(logData);
//                             const sessionId = message.key.split(':')[1]; // Extract sessionId from key

//                             // Emit the console log data for any connected clients
//                             logEventEmitter.emit('newConsoleLog', {
//                                 sessionId: sessionId,
//                                 logEntry: parsedLogData[parsedLogData.length - 1] // Emit only the latest log entry
//                             });

//                             // Log to console for debugging
//                             logger.debug(`New console log for session ${sessionId}:`, parsedLogData[parsedLogData.length - 1]);
//                         }
//                     }
//                 }
//             } catch (error) {
//                 logger.error('Error processing console log message:', error);
//             }
//         });

//         logger.info('Successfully subscribed to console logs channel (DB 0)');

//     } catch (error) {
//         logger.error('Failed to initialize log subscriber:', error);
//         throw error;
//     }
// };

// // // Helper function to subscribe to logs for a specific transaction
// // export const subscribeToTransactionLogs = (
// //     transactionId: string,
// //     callback: (logs: LogData[]) => void
// // ) => {
// //     const handler = (data: { transactionId: string, logs: LogData[] }) => {
// //         if (data.transactionId === transactionId) {
// //             callback(data.logs);
// //         }
// //     };

// //     logEventEmitter.on('newLog', handler);

// //     // Return cleanup function
// //     return () => {
// //         logEventEmitter.off('newLog', handler);
// //     };
// // };

// // Helper function to subscribe to console logs for a specific session
// export const subscribeToConsoleLogs = (
//     sessionId: string,
//     callback: (logEntry: { timestamp: string, level: string, message: string }) => void
// ) => {
//     const handler = (data: { sessionId: string, logEntry: { timestamp: string, level: string, message: string } }) => {
//         if (data.sessionId === sessionId) {
//             callback(data.logEntry);
//         }
//     };

//     logEventEmitter.on('newConsoleLog', handler);

//     // Return cleanup function
//     return () => {
//         logEventEmitter.off('newConsoleLog', handler);
//     };
// }; 