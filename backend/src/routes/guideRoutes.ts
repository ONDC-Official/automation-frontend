import { Router } from "express";
import { getMenu, getOrder, placeOrder } from "../controllers/guideController";
// import otelTracing from "../services/tracing-service";

const router = Router();

router.get(
  "/menu",
  // otelTracing("body.transaction_id", "body.session_id"),
  getMenu
);
router.post("/order", getOrder)
router.post("/placeOrder", placeOrder)

export default router;
