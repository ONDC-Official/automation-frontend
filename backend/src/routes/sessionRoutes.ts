import { Router } from "express";
import {
	clearFlow,
	createExpectation,
	createSession,
	deleteExpectation,
	getSession,
	getTransactionData,
	requestForFlowPermission,
	updateSession,
} from "../controllers/sessionController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

// Define routes and use the correct async handler types
router.post("/", createSession);

router.post(
	"/expectation",
	validateRequiredParams([
		"subscriber_url",
		"flow_id",
		"expected_action",
		"session_id",
	]),
	createExpectation
);

router.get("/", getSession);

router.get(
	"/transaction",
	validateRequiredParams(["transaction_id", "subscriber_url"]),
	getTransactionData
);

router.get(
	"/flowPermission",
	validateRequiredParams(["subscriber_url", "action"]),
	requestForFlowPermission
);

router.put("/", updateSession);

router.delete(
	"/clearFlow",
	validateRequiredParams(["session_id", "flow_id"]),
	clearFlow
);

router.delete(
	"/expectation",
	validateRequiredParams(["subscriber_url", "session_id"]),
	deleteExpectation
);

export default router;
