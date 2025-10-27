import { Router } from "express";
import { getPayload , getReport} from "../controllers/dbController";
import otelTracing from "../services/tracing-service";

const router = Router();

router.post("/payload", 
  otelTracing('body.transaction_id', 'body.session_id'),
  getPayload
);
router.get("/report", otelTracing('', 'query.session_id'), getReport);

export default router;
