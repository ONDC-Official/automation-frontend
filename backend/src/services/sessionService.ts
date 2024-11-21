
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { redisService } from 'ondc-automation-cache-lib';
import { SessionData } from '../interfaces/sessionData';
// import redisClient from '../config/redisConfig';


const SESSION_EXPIRY = 3600; // 1 hour

export const createSessionService = async (sessionId: string ,data: SessionData) => {
    const { subscriberId, participantType, domain } = data;
 
    const sessionData: SessionData = {
        sessionId,
        subscriberId,
        participantType,
        domain,
        createdAt: new Date().toISOString(),
        transactions: {}, // Empty transactions initially
    };
    try {
        // Store session data in Redis
        await redisService.setKey(sessionId, JSON.stringify(sessionData), SESSION_EXPIRY);
        // await redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', 3600);
        return 'Session created successfully';

    } catch (error) {
        throw new Error(`Error creating session`)
    }
};

export const getSessionService = async (sessionId: string) => {

    try {
        // Fetch session data from Redis
        // const sessionData = await redisClient.get(sessionId);
        const sessionData = await redisService.getKey(sessionId);
        if (!sessionData) {
            return null;
        }

        // Return the session data if found
        return JSON.parse(sessionData);

    } catch (error) {
        // Return a 500 error in case of any issues
        throw new Error('Error fetching session data')
    }

};

// Update session data
export const updateSessionService = async (sessionId: string, data: any) => {

    const { subscriberId, participantType, domain, transactionId, transactionMode, state, details } = data;

    try {
        // Retrieve the session data from Redis
        const sessionData = await redisService.getKey(sessionId);
        // const sessionData = await redisClient.get(sessionId);

        if (!sessionData) {
            throw new Error('Session not found')
        }

        const session: SessionData = JSON.parse(sessionData);

        // Update session data fields
        if (subscriberId) session.subscriberId = subscriberId;
        if (participantType) session.participantType = participantType;
        if (domain) session.domain = domain;

        // If transaction data is provided, update the transaction details
        if (transactionId && transactionMode && state) {
            session.transactions[transactionId] = {
                transactionMode,
                state,
                data: details || {},
                createdAt: new Date().toISOString(),
            };
        }

        // Save the updated session data back to Redis
        await redisService.setKey(sessionId, JSON.stringify(session), SESSION_EXPIRY);

        return 'Session updated successfully';


    } catch (error) {
        console.log(error);

        throw new Error('Error updating session');
    }
};