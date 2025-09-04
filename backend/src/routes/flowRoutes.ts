import { Router } from "express";
import {
	fetchConfig,
	generateReport,
	handleTriggerRequest,
	validatePayload,
	getPredefinedFlows,
	getExample,
	getCurrentStateFlow,
	proceedFlow,
	newFlow,
} from "../controllers/flowController";
import validateRequiredParams from "../middlewares/generic";
import otelTracing from "../services/tracing-service";
import axios from "axios";
import logger from "@ondc/automation-logger";
const router = Router();

router.get("/", fetchConfig);
router.post("/report", otelTracing("", "query.sessionId"), generateReport);
router.post(
	"/trigger/:action",
	otelTracing(
		"query.transaction_id",
		"query.session_id",
		"query.subscriber_url"
	),
	handleTriggerRequest
);
router.post(
	"/validate/:action",
	otelTracing(
		"body.context.transaction_id",
		"",
		"body.context.bap_id",
		"body.context.bpp_id"
	),
	validatePayload
);
router.get("/customFlow", getPredefinedFlows);
router.post("/examples", getExample);
router.get(
	"/current-state",
	validateRequiredParams(["session_id", "transaction_id"]),
	otelTracing("query.transaction_id", "query.session_id"),
	getCurrentStateFlow
);
router.post(
	"/proceed",
	otelTracing("body.transaction_id", "body.session_id"),
	proceedFlow
);
router.post(
	"/new",
	otelTracing("body.transaction_id", "body.session_id"),
	newFlow
);
router.post("/external-form", async (req, res) => {
	try {
		const { link, data } = req.body;
		const exRes = await axios.post(link, data);
		logger.info("Submission response", exRes);
		res.status(exRes.status).send(exRes.data);
	} catch (e) {
		logger.error("GATE WAY ERROR", {}, e);
		res.status(500).send("GATEWAY ERROR");
	}
});

export default router;
