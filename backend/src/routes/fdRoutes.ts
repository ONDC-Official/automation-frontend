import { Router } from "express";
import {
	finishFdRun,
	getFdCertificate,
	getFdExchanges,
	getFdRun,
	getFdRunReport,
	getFdSession,
	issueFdCertificate,
	playFdRun,
	startFdRun,
	stopFdRun,
	verifyFdCertificate,
} from "../controllers/fdController";

/** The FD pages' API, onto the FD workbench (see controllers/fdController.ts). */
const router = Router();

router.get("/sessions/:sessionId", getFdSession);
router.get("/sessions/:sessionId/exchanges", getFdExchanges);
router.post("/sessions/:sessionId/runs", startFdRun);
router.get("/sessions/:sessionId/runs/:runId", getFdRun);
router.post("/sessions/:sessionId/runs/:runId/play", playFdRun);
router.post("/sessions/:sessionId/runs/:runId/finish", finishFdRun);
router.delete("/sessions/:sessionId/runs/:runId", stopFdRun);
router.get("/sessions/:sessionId/runs/:runId/report", getFdRunReport);
router.post("/sessions/:sessionId/certificates", issueFdCertificate);
router.get("/sessions/:sessionId/certificates/:certificateId", getFdCertificate);
router.get("/sessions/:sessionId/certificates/:certificateId/verify", verifyFdCertificate);

export default router;
