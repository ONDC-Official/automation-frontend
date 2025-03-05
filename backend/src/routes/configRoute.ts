import { Router } from "express";
import { getFlows, getSeanrioFormData } from "../controllers/configController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

router.get(
  "/flows",
  validateRequiredParams(["domain", "version", "usecase"]),
  getFlows
);
router.get("/senarioFormData", getSeanrioFormData);

export default router;
