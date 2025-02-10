// FILE: uiController.ts
import { query, Request, Response } from "express";
import { fetchConfigService } from "../services/flowService";
import axios from "axios";
import { TriggerInput } from "../interfaces/triggerData";
import { ACK, NACK, ERROR } from "../constants/response";
import getPredefinedFlowConfig, {
	fetchExampleConfig,
} from "../config/unittestConfig";
import logger from "../utils/logger";
import { saveLog } from "../utils/console";

export const fetchConfig = (req: Request, res: Response) => {
	try {
		logger.info("fetching config");
		const config = fetchConfigService();
		res.status(200).json(config);
	} catch (error: any) {
		if (error.message === "Config not found") {
			res.status(404).json({ error: error.message });
		} else {
			res.status(500).json({ error: "Internal Server Error" });
		}
	}
};

export const generateReport = async (
	req: Request,
	res: Response
): Promise<void> => {
	const sessionId = req.query.sessionId as string;
	const body = req.body;
	if (!sessionId) {
		res.status(400).json({ error: "session_id is required" });
		return;
	}
	try {
		const response = await axios.post(
			`${process.env.REPORTING_SERVICE}/generate-report`,
			body,
			{
				params: {
					sessionId: sessionId,
				},
			}
		);
		if (response.status === 200) {
			res.status(200).json({
				message: "Report generated successfully",
				data: response.data,
			});
		}
	} catch (error: any) {
		logger.info(error);
		res
			.status(500)
			.json({ error: "Failed to generate report", details: error.message });
	}
};

export const handleTriggerRequest = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		logger.info(`Triggering action ${req.params.action}`);
		const action = req.params.action;
		if (
			!req.query.action_id ||
			!req.query.transaction_id ||
			!req.query.subscriber_url ||
			!req.query.session_id
		) {
			res.status(400).send("Bad Request");
			return;
		}
		const triggerInput: TriggerInput = req.body;

		saveLog(req.query.session_id as string, `Triggering action ${action}`);

		const response = await axios.post(
			`${process.env.MOCK_SERVICE as string}/trigger/api-service/${action}`,
			triggerInput,
			{
				params: {
					// subscriber_url: req.query.subscriber_url,
					// action_id: req.query.action_id,
					// transaction_id: req.query.transaction_id,
					...req.query,
				},
			}
		);
		logger.info("response" + JSON.stringify(response));
		if (response.status === 200) {
			res.status(200).send(ACK);
		} else {
			res.status(response.status).send("unknown");
		}
	} catch (error: any) {
		logger.error("error while triggering", error);
		if (error.response && error.response.status === 400) {
			res.status(400).send(NACK);
		} else if (error.response && error.response.status === 500) {
			res.status(500).send(ERROR);
		} else {
			res.status(500).send(ERROR);
		}
	}
};

export const validatePayload = async (
	req: Request,
	res: Response
): Promise<void> => {
	const action = req.params.action;
	const payload = req.body;

	if (!action) {
		res.status(400).send({ message: "action is required param" });
	}

	try {
		const response = await axios.post(
			`${process.env.API_SERVICE as string}/test/${action}`,
			payload
		);

		res.send(response.data);
	} catch (e) {
		logger.error("error while validating payload", e);
		res.status(500).send(ERROR);
	}
};

export const getPredefinedFlows = async (
	_req: Request,
	res: Response
): Promise<void> => {
	const config = getPredefinedFlowConfig();

	if (!config) {
		res
			.status(500)
			.send({ error: true, message: "Error while fetching config" });
	}

	res.send(config);
};

export const getExample = async (
	req: Request,
	res: Response
): Promise<void> => {
	const { filePath } = req.body;
	const config = fetchExampleConfig(filePath);

	if (!config) {
		res
			.status(500)
			.send({ error: true, message: "Error while fetching config" });
	}

	res.send(config);
};
