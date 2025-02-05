import { Request, Response } from "express";

import logger from "../utils/logger";
import {
	clearFlowService,
	createExpectationService,
	createSessionService,
	deleteExpectationService,
	getSessionService,
	getTransactionDataService,
	requestForFlowPermissionService,
	updateSessionService,
} from "../services/sessionService";

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
		res.status(201).send({
			sessionId: sessionId,
			subscriberUrl: req.body.subscriberUrl,
			message: response,
		});
	} catch (error: any) {
		console.error(error);
		res
			.status(500)
			.send({ message: "Error creating session", error: error.message });
	}
};

export const getSession = async (req: Request, res: Response) => {
	const sessionId = req.query.session_id as string;

	if (!sessionId) {
		res.status(400).send({ message: "Session_id is required." });
		return;
	}

	try {
		const sessionData = await getSessionService(sessionId);
		res.status(200).send(sessionData);
	} catch (error: any) {
		console.error(error);
		res
			.status(500)
			.send({ message: "Error fetching session", error: error.message });
	}
};

export const updateSession = async (req: Request, res: Response) => {
	const sessionId = req.query.session_id as string;

	if (!sessionId) {
		res.status(400).send({ message: "session_id is required." });
		return;
	}

	const sessionData = req.body;
	try {
		const response = await updateSessionService(sessionId, sessionData);
		setSessionCookie(res, sessionId);
		res.status(200).send({ message: response });
	} catch (error: any) {
		logger.error("error updating session", error);
		res.status(500).send({ message: "Error updating session" });
	}
};

export const clearFlow = async (req: Request, res: Response) => {
	try {
		logger.info("clearing flow");
		const sessionId = req.query.session_id as string;
		const flowId = req.query.flow_id as string;
		await clearFlowService(sessionId, flowId);
		res.status(200).send({ message: "Flow cleared" });
	} catch (e) {
		logger.error("error clearing flow", e);
		res.status(500).send({ message: "Error clearing flow" });
	}
};

export const createExpectation = async (req: Request, res: Response) => {
	try {
		const sessionId = req.query.session_id as string;
		const flowId = req.query.flow_id as string;
		const expectedAction = req.query.expected_action as string;
		const subUrl = req.query.subscriber_url as string;

		await createExpectationService(subUrl, flowId, sessionId, expectedAction);
		res.status(201).send({ message: "Expectation created" });
	} catch (e) {
		logger.error("error creating expectation", e);
		res.status(500).send({ message: "Error creating expectation" });
	}
};

export const deleteExpectation = async (req: Request, res: Response) => {
	try {
		const sessionId = req.query.session_id as string;
		const subscriberUrl = req.query.subscriber_url as string;
		await deleteExpectationService(sessionId, subscriberUrl);
		res.status(200).send({ message: "Expectation deleted" });
	} catch (e) {
		logger.error("error deleting expectation", e);
		res.status(500).send({ message: "Error deleting expectation" });
	}
};

export const getTransactionData = async (req: Request, res: Response) => {
	try {
		const transactionId = req.query.transaction_id as string;
		const subscriberUrl = req.query.subscriber_url as string;

		const data = await getTransactionDataService(transactionId, subscriberUrl);
		res.status(200).send(data);
	} catch (e) {
		logger.error("error fetching transaction data", e);
		res.status(500).send({ message: "Error fetching transaction data" });
	}
};

export const requestForFlowPermission = async (req: Request, res: Response) => {
	try {
		const subscriberUrl = req.query.subscriber_url as string;
		const action = req.query.action as string;
		const data = await requestForFlowPermissionService(subscriberUrl, action);
		logger.info("request for flow permission data:" + JSON.stringify(data));
		res.status(200).send(data);
	} catch (e) {
		logger.error("error requesting flow permission", e);
		res.status(500).send({ message: "Error requesting flow permission" });
	}
};
