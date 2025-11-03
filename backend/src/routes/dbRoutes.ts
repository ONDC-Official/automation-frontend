import { Router } from "express";
import { getPayload , getReport, getSessions} from "../controllers/dbController";
import otelTracing from "../services/tracing-service";

const router = Router();

router.post("/payload", 
  otelTracing('body.transaction_id', 'body.session_id'),
  getPayload
);
router.get("/report", otelTracing('', 'query.session_id'), getReport);
router.get("/sessions", otelTracing('', 'query.sub_id', "query.np_type"), getSessions);

export default router;
