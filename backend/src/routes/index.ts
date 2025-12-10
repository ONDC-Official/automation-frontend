import { Router } from "express";
import sessionRoutes from "./sessionRoutes"; // Import session-related routes
import flowRoutes from "./flowRoutes"; // Import flow-related routes
import unitRoutes from "./unitRoutes";
import dbRoutes from "./dbRoutes";
import logRoutes from "../routes/logRoutes"; // Add this import
import configRoutes from "./configRoute";
import sellerRoutes from "./sellerRoutes"; // Import seller routes
import imageRoutes from "./imageRoutes"; // Import image routes
import finvuRoutes from "./finvu-routes"; // Import Finvu routes

import guideRoutes from "./guideRoutes";
import authRoutes from "./gitLoginRoute"; // Import authentication routes
const router = Router();

// Mount session-related routes
router.use("/sessions", sessionRoutes);
router.use("/flow", flowRoutes);

router.use("/unit", unitRoutes);
router.use("/db", dbRoutes);
router.use("/logs", logRoutes); // Add this line
router.use("/config", configRoutes);
router.use("/seller", sellerRoutes); // Add seller routes
router.use("/images", imageRoutes); // Add image routes

// Mount Finvu routes (no prefix - routes have full paths)
router.use(finvuRoutes);

router.use("/auth", authRoutes); // Mount authentication routes
router.use("/guide", guideRoutes);
export default router;
