import { Router } from "express";
import { getSessionLogs } from "../controllers/logController";
import validateRequiredParams from "../middlewares/generic";
import otelTracing from "../services/tracing-service";

const router = Router();

router.get("/", 
  validateRequiredParams(["sessionId"]), 
  otelTracing('', 'query.sessionId'),
  getSessionLogs
);

export default router; 