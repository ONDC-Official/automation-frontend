// src/routes/sessionRoutes.ts

import { Router, Request, Response } from 'express';
import { createSession, getSession, updateSession } from '../controllers/sessionController';

const router = Router();

// Define routes and use the correct async handler types
router.post('/', createSession);


router.get('/', getSession)

router.put('/', updateSession)

export default router;
