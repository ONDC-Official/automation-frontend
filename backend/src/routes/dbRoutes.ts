import { Router } from "express";
import { getPayload } from "../controllers/dbController";

const router = Router();

router.get("/payload", getPayload);

export default router;
