import { Router } from "express";
import {
  fetchConfig,
  generateReport,
  handleTriggerRequest,
  validatePayload,
  getPredefinedFlows,
  getExample,
} from "../controllers/flowController";

const router = Router();

router.get("/", fetchConfig);
router.get("/report", generateReport);
router.post("/trigger", handleTriggerRequest);
router.post("/validate/:action", validatePayload);
router.get("/customFlow", getPredefinedFlows);
router.post("/examples", getExample);

export default router;
