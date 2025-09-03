import { Request } from "express";
import session from "express-session";

export function getLoggerMeta(req: Request) {
	return {
		correlationId: req.correlationId,
		sessionId: req.sessionID,
	};
}
