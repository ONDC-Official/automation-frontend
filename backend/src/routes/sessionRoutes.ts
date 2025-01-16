import { Router } from "express";
import {
	clearFlow,
	createSession,
	getSession,
	updateSession,
} from "../controllers/sessionController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

// Define routes and use the correct async handler types
router.post("/", createSession);

router.get("/", getSession);

router.put("/", updateSession);

router.delete(
	"/clearFlow",
	validateRequiredParams(["subscriber_url", "flow_id"]),
	clearFlow
);

export default router;
