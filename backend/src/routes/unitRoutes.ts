import { Router } from "express";
import {
	createUnitSession,
	fetchSafeActions,
	triggerUnitAction,
} from "../controllers/unitController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

router.get(
	"/safe-actions",
	validateRequiredParams(["transaction_id", "mock_type"]),
	fetchSafeActions
);

router.post("/unit-session", createUnitSession);

router.get(
	"/trigger/:action",
	validateRequiredParams(["transaction_id", "subscriber_url", "action_id"])
);

router.post(
	"/trigger/:action",
	validateRequiredParams(["transaction_id", "subscriber_url", "action_id"]),
	triggerUnitAction
);
