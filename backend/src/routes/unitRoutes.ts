import { Router } from "express";
import {
	createUnitSession,
	fetchSafeActions,
	triggerUnitAction,
	getTriggerUnitAction,
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
	validateRequiredParams(["transaction_id", "subscriber_url", "action_id"]),
	getTriggerUnitAction
);

// body.payload
router.post(
	"/trigger/:action",
	validateRequiredParams(["transaction_id", "subscriber_url", "action_id"]),
	triggerUnitAction
);

export default router;

/*
    for seller testing:
        1. new txn , safe actions
        2. get complete payload
        3. edit
        4. send 
        5. listen

    for buyer testing:
        1. create a session and listen
        2. session data chache update (search) -> [context,response]
        3. get safe actions (dropdown)
        4. get complete payload (on_search)
        5. json editor -> update payload
        6. cache gets updated 
*/
