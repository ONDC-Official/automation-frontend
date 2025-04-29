import { Router } from "express";
import { getFlows, getSeanrioFormData, getReportingStatus } from "../controllers/configController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

router.get(
  "/flows",
  validateRequiredParams(["domain", "version", "usecase"]),
  getFlows
);
router.get("/senarioFormData", getSeanrioFormData);
router.get(
  "/reportingStatus",
  validateRequiredParams(["domain", "version"]),
  getReportingStatus
);

export default router;
