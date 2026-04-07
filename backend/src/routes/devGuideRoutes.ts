import { Router } from "express";
import { getAvailableBuilds, getSpec } from "../controllers/devGuideController";

const router = Router();

router.get("/spec/:domain/:version", getSpec);

router.get("/available-builds", getAvailableBuilds);

export default router;
