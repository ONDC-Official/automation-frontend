import { NextFunction, Request, Response } from "express";
import type { DashboardConfig } from "../config/dashboardConfig";
import { verifyToken } from "../utils/dashboardSession";

/**
 * Guards every dashboard data route. Rejects before any upstream call is made,
 * so an unauthenticated caller cannot even cause traffic to automation-db.
 */
export const requireDashboardSession =
	(config: DashboardConfig) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const token = req.cookies?.[config.cookieName] as string | undefined;

		if (!verifyToken(token, config)) {
			res.status(401).json({ error: true, message: "Not authenticated" });
			return;
		}
		next();
	};
