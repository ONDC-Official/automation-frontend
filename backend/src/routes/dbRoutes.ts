import { Router } from "express";
import { getPayload } from "../controllers/dbController";

const router = Router();

router.post("/payload", getPayload);

export default router;
