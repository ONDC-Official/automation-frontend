import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';

// Key prefixes form a cross-service contract with the api-service's
// callbackFormService (which writes them) — keep in sync.
const FORM_COMPLETED_PREFIX = 'form_completed';
const LATEST_FORM_PREFIX = 'latest_form';

/**
 * Check if form callback has been received
 * Polled by the frontend after user submits form in popup
 * GET /form/check-completion?transaction_id=X[&form_id=Y]
 *
 * The api-service writes two keys on callback:
 *   form_completed:{transaction_id}:{form_id} -> completion payload
 *   latest_form:{transaction_id}              -> form_id (pointer)
 * If form_id is not supplied by the caller, it is resolved via the pointer.
 */
export const checkFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.query;
    let { form_id } = req.query;

    logger.info('Form completion check', { transaction_id, form_id });

    if (!transaction_id) {
      res.status(400).json({
        error: 'transaction_id is required',
        completed: false
      });
      return;
    }

    if (!form_id) {
      const pointerKey = `${LATEST_FORM_PREFIX}:${transaction_id}`;
      const latestFormId = await RedisService.getKey(pointerKey);
      if (!latestFormId) {
        logger.debug('Form completion check: PENDING (no callback yet)', { transaction_id });
        res.json({ completed: false });
        return;
      }
      form_id = latestFormId;
    }

    const completionKey = `${FORM_COMPLETED_PREFIX}:${transaction_id}:${form_id}`;
    const completionData = await RedisService.getKey(completionKey);

    if (completionData) {
      const data = JSON.parse(completionData);
      logger.info('Form completion check: COMPLETED', {
        transaction_id,
        form_id,
        timestamp: data.timestamp
      });

      res.json({
        completed: true,
        form_id,
        success: data.success,
        message: data.message,
        timestamp: data.timestamp
      });
      return;
    }

    // Pointer existed but completion data did not — should not happen given the
    // api-service writes completion data before the pointer.
    logger.warning('Form completion check: pointer found but completion data missing', {
      transaction_id,
      form_id
    });
    res.json({ completed: false });

  } catch (error: any) {
    logger.error('Error checking form completion', error);
    res.status(500).json({
      error: 'Failed to check completion',
      message: error.message,
      completed: false
    });
  }
};
