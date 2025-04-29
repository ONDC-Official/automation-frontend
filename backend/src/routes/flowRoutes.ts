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

const router = Router();

router.get("/", fetchConfig);
router.post("/report", generateReport);
router.post("/trigger/:action", handleTriggerRequest);
router.post("/validate/:action", validatePayload);
router.get("/customFlow", getPredefinedFlows);
router.post("/examples", getExample);
router.get(
	"/current-state",
	validateRequiredParams(["session_id", "transaction_id"]),
	getCurrentStateFlow
);
router.post("/proceed", proceedFlow);
router.post("/new", newFlow);
export default router;
