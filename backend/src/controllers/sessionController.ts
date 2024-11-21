import { Request, Response } from 'express';
import { createSessionService, getSessionService, updateSessionService } from '../services/sessionService';

const SESSION_EXPIRY = 3600; // 1 hour
const COOKIE_OPTIONS = { maxAge: SESSION_EXPIRY, httpOnly: true };

// Helper function to set session cookie
const setSessionCookie = (res: Response, sessionId: string) => {
    res.cookie('sessionId', sessionId, COOKIE_OPTIONS);
};

export const createSession = async (req: Request, res: Response) => {
    const sessionId = req.sessionID;

    if (!sessionId) {
        res.status(400).send({ message: 'Session ID is required.' });
        return;
    }

    try {
        const response = await createSessionService(sessionId, req.body);
        setSessionCookie(res, sessionId);
        res.status(201).send({ sessionId, message: response });
    } catch (error: any) {
        console.error(error); 
        res.status(500).send({ message: 'Error creating session', error: error.message });
    }
};

export const getSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
        res.status(400).send({ message: 'Session ID is required.' });
        return;
    }

    try {
        const sessionData = await getSessionService(sessionId);
        res.status(200).send(sessionData);
    } catch (error: any) {
        console.error(error); 
        res.status(500).send({ message: 'Error fetching session', error: error.message });
    }
};

export const updateSession = async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
        res.status(400).send({ message: 'Session ID is required.' });
        return;
    }

    const sessionData = req.body;
    try {
        const response = await updateSessionService(sessionId, sessionData);
        setSessionCookie(res, sessionId);
        res.status(200).send({ message: response });
    } catch (error: any) {
        console.error(error); 
        res.status(500).send({ message: 'Error updating session', error: error.message });
    }
};
