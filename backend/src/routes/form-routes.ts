import { Router } from 'express';
import {
  checkFormCompletion,
  resetFormCompletion,
  saveRedirectionUrl,
} from '../controllers/formController';

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

/**
 * Save redirection URL endpoint
 * Called by the frontend (popup before first on_status) to store the workbench
 * tab URL; the api-service GET /callback redirects the browser back to it.
 * POST /form/save-redirection   body: { session_id, redirection_url }
 */
router.post('/form/save-redirection', saveRedirectionUrl);

export default router;
