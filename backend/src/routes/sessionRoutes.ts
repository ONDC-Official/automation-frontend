import { createHash } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
	clearFlow,
	createExpectation,
	createPlaygroundSession,
	createSession,
	createStudioSession,
	getStudioSession,
	deleteExpectation,
	getSession,
	getTransactionData,
	requestForFlowPermission,
	studioSessionsRequireLogin,
	updateSession,
} from "../controllers/sessionController";
import validateRequiredParams from "../middlewares/generic";
import otelTracing from "../services/tracing-service";

const router = Router();

// Define routes and use the correct async handler types
router.post(
	"/",
	otelTracing(
		"body.transaction_id",
		"body.session_id",
		"body.bap_id",
		"body.bpp_id"
	),
	createSession
);

router.post("/playground", createPlaygroundSession);

/**
 * Starting Studio live sessions, per login token (behind the ingress every
 * caller shares one IP). Off when logins aren't required: the local workbench
 * and the e2e drivers start many sessions without one.
 */
const studioSessionLimit = rateLimit({
	windowMs: 60 * 1000,
	limit: Number(process.env.STUDIO_SESSIONS_PER_MINUTE) || 20,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	skip: () => !studioSessionsRequireLogin(),
	keyGenerator: (req) => {
		const auth = req.get("Authorization");
		return auth
			? `token:${createHash("sha256").update(auth).digest("hex")}`
			: `ip:${req.ip}`;
	},
	handler: (_req, res) => {
		res
			.status(429)
			.send({ message: "Too many live sessions started; try again in a minute." });
	},
});

router.post("/studio", studioSessionLimit, createStudioSession);

router.get(
	"/studio",
	validateRequiredParams(["session_id"]),
	otelTracing("", "query.session_id"),
	getStudioSession
);

router.post(
	"/expectation",
	validateRequiredParams([
		"subscriber_url",
		"flow_id",
		"expected_action",
		"session_id",
	]),
	otelTracing("", "query.session_id"),
	createExpectation
);

router.get("/", otelTracing("", "query.session_id"), getSession);

router.get(
	"/transaction",
	validateRequiredParams(["transaction_id", "subscriber_url"]),
	otelTracing("query.transaction_id"),
	getTransactionData
);

router.get(
	"/flowPermission",
	validateRequiredParams(["subscriber_url", "action"]),
	otelTracing("", "", "query.subscriber_url"),
	requestForFlowPermission
);

router.put(
	"/",
	otelTracing(
		"body.transaction_id",
		"body.session_id",
		"body.bap_id",
		"body.bpp_id"
	),
	updateSession
);

router.delete(
	"/clearFlow",
	validateRequiredParams(["session_id", "flow_id"]),
	otelTracing("", "query.session_id"),
	clearFlow
);

router.delete(
	"/expectation",
	validateRequiredParams(["subscriber_url", "session_id"]),
	otelTracing("", "query.session_id"),
	deleteExpectation
);

export default router;
