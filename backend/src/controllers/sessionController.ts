import { Request, Response } from "express";
import {
	clearFlowService,
	createExpectationService,
	createSessionWithCompleteData,
	createSessionService,
	deleteExpectationService,
	getSessionService,
	getTransactionDataService,
	requestForFlowPermissionService,
	updateSessionService,
	setMockSession,
	setStudioLiveConfig,
	getStudioLiveConfig,
} from "../services/sessionService";
import {
	OrganisationNotAllowedError,
	resolveSessionOwner,
} from "../services/sessionOwnerService";
import { saveLog } from "../utils/console";
import logger from "@ondc/automation-logger";
import { getLoggerMeta } from "../utils/logger-meta-utilts";

const SESSION_EXPIRY = 3600; // 1 hour
const COOKIE_OPTIONS = { maxAge: SESSION_EXPIRY, httpOnly: true };

// Helper function to set session cookie
const setSessionCookie = (res: Response, sessionId: string) => {
	res.cookie("sessionId", sessionId, COOKIE_OPTIONS);
};

export const createSession = async (req: Request, res: Response) => {
	const sessionId = req.sessionID;
	logger.info(`Creating session with ID: ${sessionId}`, getLoggerMeta(req));
	if (!sessionId) {
		logger.error("Session ID is missing in the request.", getLoggerMeta(req));
		res.status(400).send({ message: "Session ID is required." });
		return;
	}

	try {
		const owner = await resolveSessionOwner(
			req.headers.authorization,
			req.body?.userId,
			req.body?.orgId,
			getLoggerMeta(req)
		);
		const response = await createSessionService(
			sessionId,
			{ ...req.body, ...owner },
			getLoggerMeta(req)
		);
		setSessionCookie(res, sessionId);
		res.status(201).send({
			sessionId: sessionId,
			subscriberUrl: req.body.subscriberUrl,
			message: response,
		});
	} catch (error: any) {
		if (error instanceof OrganisationNotAllowedError) {
			res.status(403).send({ message: error.message });
			return;
		}
		logger.error("Error creating session", getLoggerMeta(req), error);
		res
			.status(500)
			.send({ message: "Error creating session", error: error.message });
	}
};

export const createPlaygroundSession = async (req: Request, res: Response) => {
	const sessionId = req.sessionID;
	logger.info(
		`Creating playground session with ID: ${sessionId}`,
		getLoggerMeta(req)
	);
	if (!sessionId) {
		logger.error("Session ID is missing in the request.", getLoggerMeta(req));
		res.status(400).send({ message: "Session ID is required." });
		return;
	}

	try {
		const data = req.body;
		const sessionData = data.sessionData;
		const playgroundConfig = data.playgroundConfig;

		if (!sessionData || !playgroundConfig) {
			res
				.status(400)
				.send({ message: "sessionData and playgroundConfig are required." });
			return;
		}

		const sessionRes = await createSessionWithCompleteData(
			sessionId,
			sessionData,
			getLoggerMeta(req)
		);
		// reset transaction history
		playgroundConfig.transaction_history = [];
		const mockRes = await setMockSession(
			sessionId,
			playgroundConfig,
			getLoggerMeta(req)
		);

		res.status(201).send({
			sessionId: sessionId,
			subscriberUrl: sessionData.subscriberUrl,
			message: sessionRes + " & " + mockRes,
		});
	} catch (error: any) {
		logger.error(
			"Error creating playground session",
			getLoggerMeta(req),
			error
		);
		res
			.status(500)
			.send({ message: "Error creating session", error: error.message });
	}
};

/** Why a Studio live session request is malformed, or null when it is fine. */
const checkStudioSession = (sessionData: any, studioConfig: any) => {
	if (!sessionData || typeof sessionData !== "object")
		return "sessionData is required.";
	if (!sessionData.subscriberUrl || !["BAP", "BPP"].includes(sessionData.npType))
		return "sessionData needs subscriberUrl and npType (BAP or BPP).";
	if (!studioConfig || studioConfig.kind !== "graph-v2-live")
		return "studioConfig must be a graph-v2-live document.";
	if (!Array.isArray(studioConfig.graph?.nodes) || !Array.isArray(studioConfig.graph?.edges))
		return "studioConfig.graph needs nodes and edges.";
	if (!Array.isArray(studioConfig.journeys) || studioConfig.journeys.length === 0)
		return "studioConfig needs at least one journey.";
	return null;
};

/**
 * A live session of a Protocol Studio graph. Stored like a playground session
 * (`usecaseId: PLAYGROUND-FLOW`, so the flow proxies and the api-service route
 * it to the mock's playground router), flagged `engine: "graph-v2"` so the mock
 * runs the graph executor on `PLAYGROUND_V2_<sessionId>` instead of a v1 config.
 */
export const createStudioSession = async (req: Request, res: Response) => {
	const sessionId = req.sessionID;
	logger.info(`Creating studio live session with ID: ${sessionId}`, getLoggerMeta(req));
	if (!sessionId) {
		res.status(400).send({ message: "Session ID is required." });
		return;
	}
	const { sessionData, studioConfig } = req.body ?? {};
	const problem = checkStudioSession(sessionData, studioConfig);
	if (problem) {
		res.status(400).send({ message: problem });
		return;
	}
	try {
		const session = {
			...sessionData,
			usecaseId: "PLAYGROUND-FLOW",
			engine: "graph-v2",
		};
		const sessionRes = await createSessionWithCompleteData(
			sessionId,
			session,
			getLoggerMeta(req)
		);
		const configRes = await setStudioLiveConfig(
			sessionId,
			studioConfig,
			getLoggerMeta(req)
		);
		res.status(201).send({
			sessionId,
			subscriberUrl: sessionData.subscriberUrl,
			message: sessionRes + " & " + configRes,
		});
	} catch (error: any) {
		logger.error("Error creating studio live session", getLoggerMeta(req), error);
		res
			.status(500)
			.send({ message: "Error creating session", error: error.message });
	}
};

/** The graph document of a Studio live session (for the live page). */
export const getStudioSession = async (req: Request, res: Response) => {
	const sessionId = req.query.session_id as string;
	try {
		const doc = await getStudioLiveConfig(sessionId);
		if (!doc) {
			res.status(404).send({ message: "Studio live session not found." });
			return;
		}
		res.status(200).send(doc);
	} catch (error: any) {
		logger.error("Error fetching studio live session", getLoggerMeta(req), error);
		res
			.status(500)
			.send({ message: "Error fetching session", error: error.message });
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
		logger.error("Error fetching session", getLoggerMeta(req), error);
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
		const response = await updateSessionService(
			sessionId,
			sessionData,
			getLoggerMeta(req),
			req.headers.authorization
		);
		setSessionCookie(res, sessionId);
		res.status(200).send({ message: response });
	} catch (error: any) {
		logger.error("error updating session", getLoggerMeta(req), error);
		res.status(500).send({ message: "Error updating session" });
	}
};

export const clearFlow = async (req: Request, res: Response) => {
	try {
		logger.info("clearing flow");
		const sessionId = req.query.session_id as string;
		const flowId = req.query.flow_id as string;
		await clearFlowService(sessionId, flowId, getLoggerMeta(req));
		saveLog(
			sessionId,
			`Flow cleared for session ${sessionId} and flow ${flowId}`
		);
		res.status(200).send({ message: "Flow cleared" });
	} catch (e) {
		logger.error("error clearing flow", getLoggerMeta(req), e);
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
	} catch (e: any) {
		logger.error(
			"error creating expectation",
			{
				subscriberUrl: req.query.subscriber_url,
				flowId: req.query.flow_id,
				expectedAction: req.query.expected_action,
				...getLoggerMeta(req),
			},
			e
		);
		res.status(500).send({ message: "Error creating expectation" });
	}
};

export const deleteExpectation = async (req: Request, res: Response) => {
	try {
		const sessionId = req.query.session_id as string;
		const subscriberUrl = req.query.subscriber_url as string;
		await deleteExpectationService(sessionId, subscriberUrl);
		res.status(200).send({ message: "Expectation deleted" });
	} catch (e: any) {
		logger.error(
			"error deleting expectation",
			{
				sessionId: req.query.session_id,
				subscriberUrl: req.query.subscriber_url,
			},
			e
		);
		res.status(500).send({ message: "Error deleting expectation" });
	}
};

export const getTransactionData = async (req: Request, res: Response) => {
	try {
		const transactionId = req.query.transaction_id as string;
		const subscriberUrl = req.query.subscriber_url as string;

		const data = await getTransactionDataService(transactionId, subscriberUrl);
		res.status(200).send(data);
	} catch (e: any) {
		logger.error(
			"error fetching transaction data",
			{
				transaction_id: req.query.transaction_id,
				subscriber_url: req.query.subscriber_url,
			},
			e
		);
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
		logger.error(
			"error requesting flow permission",
			{ subscriberUrl: req.query.subscriber_url, action: req.query.action },
			e
		);
		res.status(500).send({ message: "Error requesting flow permission" });
	}
};
