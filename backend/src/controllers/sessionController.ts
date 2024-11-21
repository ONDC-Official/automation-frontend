
import { Request, Response } from 'express';
import { createSessionService, getSessionService, updateSessionService } from '../services/sessionService'
// import redisClient from '../config/redisConfig';

const SESSION_EXPIRY = 3600; // 1 hour

export const createSession = async (req: Request, res: Response) => {
    const sessionId = req.sessionID;
    try {
        // Store session data in Redis
        const response = await createSessionService(sessionId, req.body);
        // await redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', 3600);
        // Set the session ID in a cookie
        res.cookie('sessionId', sessionId, { maxAge: SESSION_EXPIRY, httpOnly: true });

        res.status(201).send({ sessionId, message: response });

    } catch (error) {
        res.status(500).send({ message: 'Error creating session', error });
    }
};

export const getSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    try {
        // Fetch session data from Redis
        // const sessionData = await redisClient.get(sessionId);
        const sessionData = await getSessionService(sessionId)

        if (!sessionData) {
            // Return a 404 error if session is not found
            res.status(404).send({ message: "Session not found" });
            return;
        }

        // Return the session data if found
        res.status(200).send(sessionData);

    } catch (error) {
        // Return a 500 error in case of any issues
        res.status(500).send({ message: "Error fetching session", error });
    }

};

// Update session data
export const updateSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const sessionData = req.body;


    try {

        const response = await updateSessionService(sessionId, sessionData)
        res.cookie('sessionId', sessionId, { maxAge: SESSION_EXPIRY, httpOnly: true });
        res.status(200).send({ message: response });
        
    } catch (error) {
        res.status(500).send({ message: 'Error updating session', error });
    }
};