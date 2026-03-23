import { Router } from "express";
import { checkAllApiServiceHealth } from "../controllers/workbenchHealthController";

const router = Router();

router.get("/", (req, res) => {
    res.send({ status: "ok", message: "Health check successful" });
});

router.get("/api-service", checkAllApiServiceHealth);

export default router;
