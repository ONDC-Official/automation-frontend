import { Router } from "express";
import { getPastReports, fetchFlowData } from "../controllers/reportsController";

const router = Router();

router.get("/user/:user_id", getPastReports);
router.post("/flow-data", fetchFlowData);

export default router;
