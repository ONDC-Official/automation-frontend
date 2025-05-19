import { Router } from "express";
import {
  createUnitSession,
  fetchSafeActions,
  triggerUnitAction,
  getTriggerUnitAction,
} from "../controllers/unitController";
import validateRequiredParams from "../middlewares/generic";
import otelTracing from "../services/tracing-service";

const router = Router();

router.get(
  "/safe-actions",
  validateRequiredParams(["transaction_id", "mock_type", "session_id"]),
  otelTracing('query.transaction_id', 'query.session_id'),
  fetchSafeActions
);

router.post("/unit-session", 
  otelTracing('body.transaction_id', 'body.session_id', 'body.bap_id', 'body.bpp_id'),
  createUnitSession
);

router.get(
  "/trigger/:action",
  validateRequiredParams(["transaction_id", "subscriber_url", "action_id", "session_id"]),
  otelTracing('query.transaction_id', 'query.session_id', 'query.subscriber_url'),
  getTriggerUnitAction
);

// body.payload
router.post(
  "/trigger/:action",
  validateRequiredParams([
    "transaction_id",
    "subscriber_url",
    "action_id",
    "version",
    "session_id",
    "flow_id",
  ]),
  otelTracing('query.transaction_id', 'query.session_id', 'query.subscriber_url'),
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
