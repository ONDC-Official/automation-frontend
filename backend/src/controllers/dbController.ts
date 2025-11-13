import { Request, Response } from "express";
import {
	getPayloadForSessionId,
	getPayloadFromDomainVersionFromDb,
	getReportForSessionId,
	getSessionsForSubId,
} from "../services/dbService";
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

export const getSessions = async (req: Request, res: Response) => {
	const subID: string = req.query.sub_id as string;
	const npType: string = req.query.np_type as string;

	if (!subID || !npType) {
		res
			.status(400)
			.send({ error: true, message: "sub_id and np_type are required" });
		return;
	}

	try {
		const response = await getSessionsForSubId(subID, npType);

		res.send(response);
	} catch (e: any) {
		logger.error(
			"Error fetching payload for session ids",
			{ payload_ids: subID, npType },
			e
		);
		res.status(500).send({ error: true, message: e?.message || e });
	}
};

export const getPayloadFromDomainVersion = async (
	req: Request,
	res: Response
) => {
	try {
		logger.info("Fetching payload for domain and version");
		const domain: string = req.params.domain as string;
		const version: string = req.params.version as string;
		const action: string = req.params.action as string;
		let page = req.params.page;

		if (!domain || !version) {
			res
				.status(400)
				.send({ error: true, message: "domain and version are required" });
			return;
		}

		// default page to 1
		if (!page) {
			page = "1";
		}
		const data = await getPayloadFromDomainVersionFromDb(
			domain,
			version,
			action,
			parseInt(page as string)
		);
		res.send(data);
	} catch (e: any) {
		logger.error(
			"Error fetching payload for domain and version",
			{ domain: req.query.domain, version: req.query.version },
			e
		);
		res.status(500).send({ error: true, message: "Internal Server Error" });
	}
};

export const tryAuthenticateAdmin = async (req: Request, res: Response) => {
	const username: string = req.query.username as string;
	const password: string = req.query.password as string;

	const adminUsername = process.env.ADMIN_USERNAME;
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!username || !password) {
		res
			.status(400)
			.send({ error: true, message: "username and password are required" });
		return;
	}
	if (!adminUsername || !adminPassword) {
		res
			.status(500)
			.send({ error: true, message: "Admin credentials not set in server" });
		return;
	}

	if (username === adminUsername && password === adminPassword) {
		res.send({ authenticated: true });
	} else {
		res.send({ authenticated: false });
	}
};
