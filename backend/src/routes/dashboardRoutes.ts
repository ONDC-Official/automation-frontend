import { NextFunction, Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import logger from "@ondc/automation-logger";
import {
	loadDashboardConfig,
	type DashboardConfig,
	type DashboardConfigResult,
} from "../config/dashboardConfig";
import { requireDashboardSession } from "../middlewares/dashboardAuth";
import {
	login,
	logout,
	me,
	proxy,
} from "../controllers/dashboardController";

/**
 * Routes for the business dashboard (frontend: src/pages/business-dashboard).
 *
 * Exported as a factory so tests can mount it on a bare express app without
 * dragging in Redis and OpenTelemetry via app.ts.
 */
export function dashboardRoutes(config: DashboardConfig): Router {
	const router = Router();

	// Brute force is the only realistic attack on a single shared password.
	const loginLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 10,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: { error: true, message: "Too many attempts, try again later" },
	});

	router.post("/auth/login", loginLimiter, login(config));
	router.post("/auth/logout", logout(config));
	router.get("/auth/me", me(config));

	// Everything below this line needs a session, including anything that would
	// otherwise fall through to the proxy.
	router.use(requireDashboardSession(config));
	router.use(proxy(config));

	return router;
}

/**
 * Config is resolved on first request rather than at import time, because this
 * module is loaded via app.ts before index.ts gets to call dotenv.config().
 */
let resolved: DashboardConfigResult | null = null;
let delegate: Router | null = null;

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
	if (!resolved) {
		resolved = loadDashboardConfig();
		if (!resolved.ok) {
			logger.error(
				`Business dashboard is disabled: ${resolved.reason}. Set DASHBOARD_PASSWORD and DASHBOARD_SESSION_SECRET to enable /dashboard.`
			);
		} else {
			delegate = dashboardRoutes(resolved.config);
		}
	}

	if (!delegate) {
		res.status(503).json({
			error: true,
			message: "Business dashboard is not configured on this server",
		});
		return;
	}

	delegate(req, res, next);
});

export default router;
