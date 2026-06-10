import { Router } from 'express';
import { checkFormCompletion, resetFormCompletion } from '../controllers/formController';

const router = Router();

/**
 * Check form completion endpoint
 * Polled by frontend to check if form callback has been received from api-service
 * GET /form/check-completion?transaction_id=X
 */
router.get('/form/check-completion', checkFormCompletion);

/**
 * Reset form completion endpoint
 * Called by frontend before it starts polling so stale completions from
 * earlier forms in the same transaction can't satisfy the new poll
 * POST /form/reset-completion?transaction_id=X
 */
router.post('/form/reset-completion', resetFormCompletion);

export default router;
