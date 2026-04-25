import { Router } from "express";
import { aiProxy } from "../controllers/aiProxyController";

const router = Router();

router.post("/proxy", aiProxy);
router.get("/proxy", aiProxy);

export default router;
