import { Router } from 'express';
import { fetchConfig, generateReport, handleTriggerRequest, validatePayload } from '../controllers/flowController';

const router = Router();

router.get('/', fetchConfig);
router.get('/report', generateReport);
router.post('/trigger', handleTriggerRequest);
router.post("/validate/:action", validatePayload)

export default router;