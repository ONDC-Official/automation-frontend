import { Router } from "express";
import { getFlows } from "../controllers/configController";
import validateRequiredParams from "../middlewares/generic";

const router = Router();

router.get(
  "/flows",
  validateRequiredParams(["domain", "version", "usecase"]),
  getFlows
);

export default router;
