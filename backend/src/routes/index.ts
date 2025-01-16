import { Router } from "express";
import sessionRoutes from "./sessionRoutes"; // Import session-related routes
import flowRoutes from "./flowRoutes"; // Import flow-related routes
import unitRoutes from "./unitRoutes";
import dbRoutes from "./dbRoutes";

const router = Router();

// Mount session-related routes
router.use("/sessions", sessionRoutes);
router.use("/flow", flowRoutes);
router.use("/unit", unitRoutes);
router.use("/db", dbRoutes);

export default router;
