import { Router } from 'express';
import sessionRoutes from './sessionRoutes';  // Import session-related routes
import flowRoutes from './flowRoutes';  // Import flow-related routes

const router = Router();

// Mount session-related routes
router.use('/sessions', sessionRoutes);
router.use('/flow', flowRoutes);

export default router;
