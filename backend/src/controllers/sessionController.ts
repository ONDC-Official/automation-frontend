import { Request, Response } from "express";
import {
	clearFlowService,
	createSessionService,
	getSessionService,
	updateSessionService,
} from "../services/sessionService";
import logger from "../utils/logger";

const SESSION_EXPIRY = 3600; // 1 hour
const COOKIE_OPTIONS = { maxAge: SESSION_EXPIRY, httpOnly: true };

// Helper function to set session cookie
const setSessionCookie = (res: Response, sessionId: string) => {
	res.cookie("sessionId", sessionId, COOKIE_OPTIONS);
};

export const createSession = async (req: Request, res: Response) => {
	const sessionId = req.sessionID;

	if (!sessionId) {
		res.status(400).send({ message: "Session ID is required." });
		return;
	}

	try {
		const response = await createSessionService(sessionId, req.body);
		setSessionCookie(res, sessionId);
		res.status(201).send({ sessionId, message: response });
	} catch (error: any) {
		console.error(error);
		res
			.status(500)
			.send({ message: "Error creating session", error: error.message });
	}
};

export const getSession = async (req: Request, res: Response) => {
	const subscriber_url = req.query.subscriber_url as string;

	if (!subscriber_url) {
		res.status(400).send({ message: "Session Key is required." });
		return;
	}

	try {
		const sessionData = await getSessionService(subscriber_url);
		res.status(200).send(sessionData);
	} catch (error: any) {
		console.error(error);
		res
			.status(500)
			.send({ message: "Error fetching session", error: error.message });
	}
};

export const updateSession = async (req: Request, res: Response) => {
	const subscriber_url = req.query.subscriber_url as string;

	if (!subscriber_url) {
		res.status(400).send({ message: "subscriber url is required." });
		return;
	}

	const sessionData = req.body;
	try {
		const response = await updateSessionService(subscriber_url, sessionData);
		setSessionCookie(res, subscriber_url);
		res.status(200).send({ message: response });
	} catch (error: any) {
		logger.error("error updating session", error);
		res.status(500).send({ message: "Error updating session" });
	}
};

export const clearFlow = async (req: Request, res: Response) => {
	try {
		logger.info("clearing flow");
		const subscriber_url = req.query.subscriber_url as string;
		const flow_id = req.query.flow_id as string;
		await clearFlowService(subscriber_url, flow_id);
		res.status(200).send({ message: "Flow cleared" });
	} catch (e) {
		logger.error("error clearing flow", e);
		res.status(500).send({ message: "Error clearing flow" });
	}
};
