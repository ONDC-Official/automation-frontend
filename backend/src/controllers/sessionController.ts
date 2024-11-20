
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { redisService } from 'ondc-automation-cache-lib';
import { SessionData } from '../interfaces/sessionData';
// import redisClient from '../config/redisConfig';
import redisClient from '../config/redisConfig'; // Import the Redis client

const SESSION_EXPIRY = 3600; // 1 hour

export const createSession = async (req: Request, res: Response) => {
    const { subscriberId, participantType, domain } = req.body;

    const sessionId = req.sessionID; 
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
        // await redisService.setKey(sessionId, JSON.stringify(sessionData), SESSION_EXPIRY);
        await redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', 3600);
        // Set the session ID in a cookie
        res.cookie('sessionId', sessionId, { maxAge: SESSION_EXPIRY * 1000, httpOnly: true });

        res.status(201).send({ sessionId, message: "Session created successfully" });
        return;
    } catch (error) {
        res.status(500).send({ message: 'Error creating session', error });
    }
};

export const getSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    // if (!sessionId || typeof sessionId !== "string") {
    //     // Return a 400 error if sessionId is missing or invalid
    //     res.status(400).send({ message: "Invalid session ID" });
    //     return;
    // }
    try {
        // Fetch session data from Redis
        const sessionData = await redisClient.get(sessionId);
        // const sessionData = await redisService.getKey(sessionId);
        if (!sessionData) {
            // Return a 404 error if session is not found
            res.status(404).send({ message: "Session not found" });
            return;
        }

        // Return the session data if found
        res.status(200).send(sessionData);
        return;
    } catch (error) {
        // Return a 500 error in case of any issues
        res.status(500).send({ message: "Error fetching session", error });
    }

};

// Update session data
export const updateSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const { subscriberId, participantType, domain, transactionId, transactionMode, state, details } = req.body;
    // if (!sessionId || typeof sessionId !== "string") {
    //     // Return a 400 error if sessionId is missing or invalid
    //     res.status(400).send({ message: "Invalid session ID" });
    //     return;
    // }
    try {
        // Retrieve the session data from Redis
        // const sessionData = await redisService.getKey(sessionId);
        const sessionData = await redisClient.get(sessionId);

        if (!sessionData) {
            res.status(404).send({ message: 'Session not found' });
            return;
        }
        else {
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
            // await redisService.setKey(sessionId, JSON.stringify(session), SESSION_EXPIRY);
            await redisClient.set(sessionId, JSON.stringify(session), 'EX', 3600);

            res.status(200).send({ message: 'Session updated successfully', session });
            return;
        }

    } catch (error) {
        res.status(500).send({ message: 'Error updating session', error });
    }
};