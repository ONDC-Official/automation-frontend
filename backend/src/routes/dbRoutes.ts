import { Router } from "express";
import {
	getPayload,
	getPayloadFromDomainVersion,
	getReport,
	getSessions,
	tryAuthenticateAdmin,
} from "../controllers/dbController";
import otelTracing from "../services/tracing-service";

const router = Router();

router.post(
	"/payload",
	otelTracing("body.transaction_id", "body.session_id"),
	getPayload
);
router.get("/report", otelTracing("", "query.session_id"), getReport);
router.get(
	"/sessions",
	otelTracing("", "query.sub_id", "query.np_type"),
	getSessions
);
router.get(
	"/payloads/:domain/:version/:action/:page?",
	getPayloadFromDomainVersion
);

router.get("/admin/auth", tryAuthenticateAdmin);

export default router;
