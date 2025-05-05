import { Router } from "express";
import { getPayload } from "../controllers/dbController";
import otelTracing from "../services/tracing-service";

const router = Router();

router.post("/payload", 
  otelTracing('body.transaction_id', 'body.session_id'),
  getPayload
);

export default router;
