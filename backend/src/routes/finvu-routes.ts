import { Router } from 'express';
import { 
  verifyConsent, 
  generateConsent, 
  checkFinvuServiceHealth,
  handleFinvuCallback,
  checkFinvuCompletion
} from '../controllers/finvuController';

const router = Router();

// ============================================
// Route Definitions
// ============================================

/**
 * Finvu callback endpoint
 * Called BY FINVU when user completes the consent
 */
router.get('/finvu-callback', handleFinvuCallback);

/**
 * Check completion endpoint
 * Polled by frontend to check if Finvu callback has been received
 */
router.get('/finvu/check-completion', checkFinvuCompletion);

/**
 * Verify consent endpoint
 * Proxy to automation-finvu-aa-service
 */
router.post('/finvu/verify-consent', verifyConsent);

/**
 * Generate consent endpoint
 * Proxy to automation-finvu-aa-service
 */
router.post('/finvu/generate-consent', generateConsent);

/**
 * Service health check endpoint
 * Checks automation-finvu-aa-service health
 */
router.get('/finvu/service-health', checkFinvuServiceHealth);

export default router;

