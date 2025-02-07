import axios from "axios";
import { Request, Response } from "express";
import { createUnitSessionService } from "../services/unitService";
import { ACK } from "../constants/response";

const SESSION_EXPIRY = 3600;
const COOKIE_OPTIONS = { maxAge: SESSION_EXPIRY, httpOnly: true };

const setSessionCookie = (res: Response, sessionId: string) => {
	res.cookie("sessionId", sessionId, COOKIE_OPTIONS);
};

export const fetchSafeActions = async (req: Request, res: Response) => {
	try {
		const query = req.query;
		const mockUrl = process.env.MOCK_SERVICE;
		const opUrl = `${mockUrl}/trigger/safe-actions`;
		const response = await axios.get(opUrl, {
			params: {
				transaction_id: query.transaction_id,
				mock_type: query.mock_type,
			},
		});
		res.status(200).send(response.data);
	} catch (e) {
		console.log("err", e);
		res
			.status(500)
			.send({ error: true, message: "Error while fetching safe actions" });
	}
};

export const createUnitSession = async (req: Request, res: Response) => {
	try {
		const sessionId = req.sessionID;
		if (!sessionId) {
			res.status(400).send({ message: "Session ID is required." });
			return;
		}

		const response = await createUnitSessionService(sessionId, req.body);
		setSessionCookie(res, sessionId);
		res.status(201).send({ sessionId, message: response });
	} catch (e) {
		console.error("er", e);
		res
			.status(500)
			.send({ error: true, message: "Error while creating session" });
	}
};

export const triggerUnitAction = async (req: Request, res: Response) => {
	try {
		const action = req.params.action;
		if (!action) {
			res.status(400).send({ message: "action is required param" });
		}
		const { action_id, transaction_id, subscriber_url, session_id, version, flow_id } = req.query;
		const payload = req.body.payload;
		if (!payload) {
			res.status(400).send({ message: "payload is required" });
		}

		const response = await axios.post(
			`${process.env.MOCK_SERVICE as string}/trigger/api-service/${action}`,
			req.body,
			{
				params: {
					subscriber_url: subscriber_url,
					action_id: action_id,
					transaction_id: transaction_id,
					version: version,
					session_id: session_id,
					flow_id: flow_id,
				},
			}
		);
		console.log("response mock after sending payload: ", response.data);
		if (response.status === 200) {
			res.status(200).send(ACK);
		} else {
			res.status(response.status).send("unknown");
		}
	} catch (e) {
		console.error("er", e);
		res
			.status(500)
			.send({ error: true, message: "Error while triggering action" });
	}
};

export const getTriggerUnitAction = async (req: Request, res: Response) => {
	try {
		const action = req.params.action;
		const { action_id, transaction_id, subscriber_url } = req.query;
		const response = await axios.get(
			`${process.env.MOCK_SERVICE as string}/trigger/payload/${action}`,
			{
				params: {
					subscriber_url: subscriber_url,
					action_id: action_id,
					transaction_id: transaction_id,
				},
			}
		);
		console.log("response", response);
		res.status(200).send(response.data);
	} catch (e) {
		console.error("er", e);
		res
			.status(500)
			.send({ error: true, message: "Error while triggering action" });
	}
};
