import { Request, Response, RequestHandler } from 'express';
import { RedisService } from 'ondc-automation-cache-lib';
import logger from '@ondc/automation-logger';

// Key prefixes form a cross-service contract with the api-service's
// callbackFormService (which writes them) — keep in sync.
const FORM_COMPLETED_PREFIX = 'form_completed';
const LATEST_FORM_PREFIX = 'latest_form';

// After the first successful read, completion keys are re-armed with this TTL
// instead of being deleted, so every session polling the same transaction
// (buyer AND seller workbench sessions) can observe the completion before it
// self-cleans.
const CONSUMED_TTL_SECONDS = 60;

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

     await RedisService.setKey(
        `${LATEST_FORM_PREFIX}:${transaction_id}`,
        String(form_id),
        CONSUMED_TTL_SECONDS
      );
      await RedisService.setKey(completionKey, completionData, CONSUMED_TTL_SECONDS);

    if (completionData) {
      const data = JSON.parse(completionData);
      logger.info('Form completion check: COMPLETED', {
        transaction_id,
        form_id,
        timestamp: data.timestamp
      });

      // Consume the completion so the next form's polling starts clean —
      // without this, a transaction with multiple forms sees the previous
      // form's completion instantly on its first poll. Note this means a
      // completed:true response is delivered to exactly one poll request.
      await RedisService.deleteKey(`${LATEST_FORM_PREFIX}:${transaction_id}`);
      await RedisService.deleteKey(completionKey);

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

/**
 * Clear any leftover form completion for a transaction
 * Called by the frontend BEFORE it starts polling, so a completion left
 * over from an earlier form in the same transaction (e.g. the user closed
 * the tab without the poll consuming it) cannot satisfy the new poll.
 * POST /form/reset-completion?transaction_id=X
 */
export const resetFormCompletion: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      res.status(400).json({ error: 'transaction_id is required' });
      return;
    }

    const pointerKey = `${LATEST_FORM_PREFIX}:${transaction_id}`;
    const formId = await RedisService.getKey(pointerKey);

    if (formId) {
      // Delete via the pointer — the poll path resolves through it, so no
      // scan over form_completed:{txn}:* is needed.
      await RedisService.deleteKey(`${FORM_COMPLETED_PREFIX}:${transaction_id}:${formId}`);
      await RedisService.deleteKey(pointerKey);
      logger.info('Form completion state reset', { transaction_id, form_id: formId });
    } else {
      logger.debug('Form completion reset: nothing to clear', { transaction_id });
    }

    res.json({ reset: true });

  } catch (error: any) {
    logger.error('Error resetting form completion', error);
    res.status(500).json({
      error: 'Failed to reset completion',
      message: error.message
    });
  }
};
