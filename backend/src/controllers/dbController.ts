import { Request, Response } from "express";
import { getPayloadForSessionId, getReportForSessionId } from "../services/dbService";
import logger from "@ondc/automation-logger";
export const getPayload = async (req: Request, res: Response) => {
	const body = req.body;

	if (!body?.payload_ids?.length) {
		res.status(400).send({ error: true, message: "Payload ids are required" });
		return;
	}

	try {
		const response = await getPayloadForSessionId(body.payload_ids);

		res.send(response);
	} catch (e: any) {
		logger.error(
			"Error fetching payload for session ids",
			{ payload_ids: body.payload_ids },
			e
		);
		res.status(500).send({ error: true, message: e?.message || e });
	}
};

export const getReport = async (req: Request, res: Response) => {
	const sessionId: string = req.query.session_id as string;

	if (!sessionId) {
		res.status(400).send({ error: true, message: "Session id is required" });
		return;
	}

	try {
		const response = await getReportForSessionId(sessionId);

		res.send(response);
	} catch (e: any) {
		logger.error(
			"Error fetching payload for session ids",
			{ payload_ids: sessionId },
			e
		);
		res.status(500).send({ error: true, message: e?.message || e });
	}
};
