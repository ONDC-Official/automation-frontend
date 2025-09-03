import { Request, Response } from "express";
import { getLogs } from "../services/logService";

export const getSessionLogs = async (req: Request, res: Response) => {
	try {
		const sessionId = req.query.sessionId as string;
		const logs = await getLogs(sessionId);
		res.status(200).json(logs);
	} catch (error: any) {
		console.error(
			"Error fetching logs:",
			{
				sessionId: req.query.sessionId,
			},
			error
		);
		res.status(500).json({
			error: true,
			message: "Error fetching logs",
			details: error.message,
		});
	}
};
