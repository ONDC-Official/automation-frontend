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
 * GET /form/check-completion?session_id=X
 */
router.get('/form/check-completion', checkFormCompletion);

/**
 * Reset form completion endpoint
 * Called by frontend before it starts polling so a stale completion from an
 * earlier run on the same session can't satisfy the new poll
 * POST /form/reset-completion?session_id=X
 */
router.post('/form/reset-completion', resetFormCompletion);

/**
 * Save redirection URL endpoint
 * The frontend stores its current workbench URL before the form opens; the
 * api-service callback looks it up to write completion and 302 the user back.
 * POST /form/save-redirection   body: { redirection_url }
 */
router.post('/form/save-redirection', saveRedirectionUrl);

export default router;
