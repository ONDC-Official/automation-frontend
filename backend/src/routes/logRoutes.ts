import { Router } from "express";
import { getSessionLogs } from "../controllers/logController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

router.get("/", validateRequiredParams(["sessionId"]), getSessionLogs);

export default router; 