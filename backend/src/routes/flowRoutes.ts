import { Router } from 'express';
import { fetchConfig, generateReport, handleTriggerRequest } from '../controllers/flowController';

const router = Router();

router.get('/', fetchConfig);
router.get('/report', generateReport);
router.post('/trigger', handleTriggerRequest);

export default router;